import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ---- CORE IMPORTS ---- //
import {getGlobalConfig} from '@/tenant/config-provider';

// ---- LOCAL IMPORTS ---- //
import {
  CACHE_VERSION,
  DEFAULT_CACHE_MAX_BYTES,
  IMAGE_FORMAT,
} from './constants';

/**
 * On-disk cache of resized images.
 *
 * An entry is a single file named `<key>.<byte length>.<format>`, so the whole
 * cache is described by one directory listing and no index can fall out of step
 * with the files. A damaged or half-written entry reads as a miss.
 *
 * Entries do not expire. The key covers the source file's length and timestamp,
 * so a replaced file takes a new key and the entry it supersedes falls out by
 * eviction. A replacement that keeps both the length and the timestamp — one
 * restored with its metadata intact, say — is not distinguished.
 *
 * The cache is keyed on the source file and the requested size alone, and holds
 * no notion of who asked for it. That is safe only because every caller checks
 * access before reaching this module, on every request.
 */

/**
 * Bytes the cache may occupy, from `"$global".imageCacheMaxBytes`.
 *
 * One directory beside the build holds every tenant's derivatives, so the budget
 * is the deployment's rather than any tenant's. Entries are keyed by the absolute
 * source path, which is what keeps one tenant's derivatives distinct from
 * another's — a relative path here would make them collide.
 */
function maxBytes(): number {
  return getGlobalConfig().imageCacheMaxBytes ?? DEFAULT_CACHE_MAX_BYTES;
}

/**
 * Where derivatives are kept: beside the build, which is replaced with each
 * deployment, and never under the file storage root — anything there is a
 * candidate to be served, and files we generate do not belong beside the ones
 * the ERP owns.
 *
 * Written as one fixed path on purpose. The bundler reads these paths to work
 * out what the build needs at run time, and it can only leave the rest behind
 * while it can follow them to a single directory. Given a path that depends on
 * the environment it stops being able to, and copies the entire project — the
 * repository and all — into the output.
 */
const CACHE_DIR = path.join(process.cwd(), '.next', 'cache', 'images');

function cacheDir(): string {
  return CACHE_DIR;
}

/**
 * Identifies a derivative by the bytes it was made from and how it was made.
 *
 * The storage path names the blob, and its length and modification time stand in
 * for the contents: the ERP replaces a file in place, keeping the record and the
 * path, so the path alone would go on naming the previous bytes. Two records
 * pointing at one blob share a derivative, which is correct — they are the same
 * image.
 */
export interface DerivativeKey {
  filePath: string;
  size: number;
  modifiedAt: number;
  width: number;
  quality: number;
}

export function derivativeKey({
  filePath,
  size,
  modifiedAt,
  width,
  quality,
}: DerivativeKey): string {
  return crypto
    .createHash('sha256')
    .update(
      [
        CACHE_VERSION,
        filePath,
        size,
        modifiedAt,
        width,
        quality,
        IMAGE_FORMAT,
      ].join(':'),
    )
    .digest('base64url');
}

/*
 * What is held, in least-recently-used order, and how much of it there is.
 *
 * A Map preserves insertion order, so re-inserting on read moves an entry to the
 * end and the oldest is always the first key. The total is carried alongside and
 * adjusted as entries come and go: recomputing it per write would mean walking
 * every entry on the event loop, and a cache of small thumbnails holds a great
 * many of them.
 */
interface CacheIndex {
  sizes: Map<string, number>;
  bytes: number;
}

let cache: Promise<CacheIndex> | null = null;

const ENTRY_PATTERN = new RegExp(
  `^([A-Za-z0-9_-]+)\\.(\\d+)\\.${IMAGE_FORMAT}$`,
);

async function index(): Promise<CacheIndex> {
  /*
   * A failed listing is not remembered. The directory can be briefly
   * unavailable — a volume still mounting at startup, a moment of read-only —
   * and holding on to the rejection would leave the process serving originals
   * for the rest of its life with no way back.
   */
  cache ??= (async () => {
    const dir = cacheDir();
    await fs.promises.mkdir(dir, {recursive: true});

    const sizes = new Map<string, number>();
    let bytes = 0;
    const leftovers: string[] = [];

    for (const name of await fs.promises.readdir(dir)) {
      const match = ENTRY_PATTERN.exec(name);
      if (match) {
        const size = Number(match[2]);
        sizes.set(match[1], size);
        bytes += size;
      } else if (name.startsWith('.')) {
        leftovers.push(name);
      }
    }

    /*
     * Clear up anything a previous process left half-written. A derivative is
     * written under a temporary name and renamed into place, so a process that
     * stopped in between leaves a file no listing counts and no eviction would
     * ever reclaim. Nothing is being written yet — a write waits on this listing
     * before it creates anything — so everything found here is from before.
     */
    for (const name of leftovers) {
      await fs.promises.rm(path.join(dir, name), {force: true}).catch(() => {});
    }

    return {sizes, bytes};
  })().catch(error => {
    cache = null;
    throw error;
  });

  return cache;
}

function entryPath(key: string, size: number): string {
  return path.join(cacheDir(), `${key}.${size}.${IMAGE_FORMAT}`);
}

/**
 * Whether a derivative is held, without reading it.
 *
 * Lets a caller answer "not modified" from the listing alone. Reading the file
 * to decide whether it needs to be sent would mean loading every image in full
 * on the one path that exists to avoid sending it.
 */
export async function hasDerivative(key: string): Promise<boolean> {
  const {sizes} = await index();
  return sizes.has(key);
}

/**
 * Read a derivative, or null if it is not held.
 *
 * A missing file is forgotten, so the caller produces it again. Any other
 * failure — no descriptors left, a moment of unreadability — leaves the entry
 * alone: it is far more likely to be a passing condition than a lost file, and
 * discarding entries under load is how a cache empties itself exactly when it is
 * needed most.
 */
export async function readDerivative(key: string): Promise<Buffer | null> {
  const map = await index();
  const size = map.sizes.get(key);
  if (size === undefined) return null;

  try {
    const buffer = await fs.promises.readFile(entryPath(key, size));
    /* Re-insert to mark the entry as the most recently used. */
    map.sizes.delete(key);
    map.sizes.set(key, size);
    return buffer;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      map.sizes.delete(key);
      map.bytes -= size;
    }
    return null;
  }
}

/**
 * Store a derivative and bring the cache back inside its budget.
 *
 * Written under a temporary name and renamed into place, so a reader listing the
 * directory never sees a partially written entry.
 *
 * Storing is best-effort: a full disk or a read-only volume costs the caller its
 * cache, not its response. Eviction still runs afterwards either way — a disk
 * that has filled is precisely when the cache most needs to shed entries, and it
 * is also when writing one fails.
 */
export async function writeDerivative(
  key: string,
  buffer: Buffer,
): Promise<void> {
  const temporary = path.join(cacheDir(), `.${key}.${crypto.randomUUID()}`);
  let map: CacheIndex | undefined;

  try {
    map = await index();
    await fs.promises.writeFile(temporary, buffer);
    await fs.promises.rename(temporary, entryPath(key, buffer.byteLength));

    const previous = map.sizes.get(key);
    if (previous !== undefined && previous !== buffer.byteLength) {
      /* A different length means a different file name, which the rename above
       * did not replace. */
      await fs.promises
        .rm(entryPath(key, previous), {force: true})
        .catch(() => {});
      map.bytes -= previous;
    } else if (previous !== undefined) {
      map.bytes -= previous;
    }

    map.sizes.delete(key);
    map.sizes.set(key, buffer.byteLength);
    map.bytes += buffer.byteLength;
  } catch (error) {
    console.error('[IMAGE][CACHE] failed to store derivative:', error);
    /*
     * Clear up a partial write. The temporary name is not one the listing
     * matches, so anything left behind would sit in the directory uncounted and
     * never be evicted.
     */
    await fs.promises.rm(temporary, {force: true}).catch(() => {});
  }

  if (map) await evict(map);
}

/*
 * Evictions run one at a time.
 *
 * Each pass decides how much to remove from the total it can see. Two passes at
 * once cannot see each other's deletions, so both keep going against a total
 * that the other has already reduced, and between them they empty a cache that
 * needed a few entries removed.
 */
let evicting: Promise<void> = Promise.resolve();

function evict(map: CacheIndex): Promise<void> {
  evicting = evicting.then(() => shrink(map));
  return evicting;
}

/** Drop the least recently used entries until the budget is met. */
async function shrink(map: CacheIndex): Promise<void> {
  const budget = maxBytes();

  for (const [key, size] of map.sizes) {
    if (map.bytes <= budget) break;

    /*
     * Forget the entry only once its file is gone. Forgetting first would leave
     * bytes on disk that nothing counts and no later pass would ever reclaim.
     */
    try {
      await fs.promises.rm(entryPath(key, size), {force: true});
    } catch (error) {
      console.error('[IMAGE][CACHE] failed to evict derivative:', error);
      continue;
    }

    map.sizes.delete(key);
    map.bytes -= size;
  }
}

/**
 * Confirm the cache directory can be listed and written to, and report how much
 * it already holds. Used by the startup check; throws if the directory is
 * unusable, so a cache that cannot be written is reported once at boot rather
 * than discovered one silent failure at a time.
 */
export async function probeCache(): Promise<{entries: number; bytes: number}> {
  const map = await index();

  const probe = path.join(cacheDir(), `.probe.${crypto.randomUUID()}`);
  try {
    await fs.promises.writeFile(probe, '');
  } finally {
    await fs.promises.rm(probe, {force: true}).catch(() => {});
  }

  return {entries: map.sizes.size, bytes: map.bytes};
}
