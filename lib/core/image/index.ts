import fs from 'fs';
import type {Sharp} from 'sharp';
import {z} from 'zod';

// ---- LOCAL IMPORTS ---- //
import {
  derivativeKey,
  hasDerivative,
  readDerivative,
  writeDerivative,
} from './cache';
import {
  BYPASS_SIGNATURES,
  DEFAULT_IMAGE_QUALITY,
  ENCODE_TIMEOUT_SECONDS,
  IMAGE_EFFORT,
  IMAGE_FORMAT,
  IMAGE_QUALITIES,
  IMAGE_WIDTHS,
  LIBVIPS_CONCURRENCY,
  MAX_CONCURRENT_RESIZES,
  MAX_INPUT_PIXELS,
  MAX_SOURCE_BYTES,
  MAX_WAITING_RESIZES,
  SIGNATURE_BYTES,
} from './constants';

/**
 * Produces the resized image a route serves in place of the original.
 *
 * Access is never decided here. A caller reaches this module only after it has
 * checked, on this request, that the viewer may see the file — the derivative
 * cache is shared, so anything that decided access once and reused the answer
 * would hand one viewer's file to another.
 */

const requestSchema = z.object({
  w: z.coerce
    .number()
    .int()
    .refine(value => (IMAGE_WIDTHS as readonly number[]).includes(value)),
  q: z.coerce
    .number()
    .int()
    .refine(value => (IMAGE_QUALITIES as readonly number[]).includes(value))
    .optional(),
});

/**
 * What a request asked for.
 *
 * `none` is a request for the file itself — a download, a direct link — and is
 * answered with the whole file, which is most of the traffic through here.
 * `invalid` is a request that named a size we do not serve; it is refused rather
 * than quietly answered with the full-size file, so a mistake shows up as a
 * mistake instead of as an unexplained increase in traffic.
 */
export type SizeRequest =
  | {kind: 'none'}
  | {kind: 'invalid'}
  | {kind: 'size'; width: number; quality: number};

export function parseImageRequest(url: URL): SizeRequest {
  const w = url.searchParams.get('w');
  const q = url.searchParams.get('q');

  /* A width is what asks for a resize; without one there is nothing to serve
   * but the file itself, whatever else the address carries. */
  if (w === null) return {kind: 'none'};

  const parsed = requestSchema.safeParse({w, q: q ?? undefined});
  if (!parsed.success) return {kind: 'invalid'};

  return {
    kind: 'size',
    width: parsed.data.w,
    quality: parsed.data.q ?? DEFAULT_IMAGE_QUALITY,
  };
}

/**
 * Whether it is worth trying to resize a file.
 *
 * This reads the type recorded on the file, which is whatever the client
 * declared when uploading it and is never verified against the contents. It is
 * therefore only a hint that saves opening a file that is plainly not an image;
 * what the file actually turns out to be is decided from its own bytes.
 */
export function isResizable(fileType: string | null | undefined): boolean {
  return Boolean(fileType?.startsWith('image/'));
}

/*
 * The imaging library is loaded on first use rather than imported.
 *
 * It binds a native library at load time, and this module is reached from the
 * path that serves every download. Importing it directly would mean a platform
 * binary missing from a build takes invoices and attachments down with it,
 * instead of costing only the resizing this module exists for.
 */
type SharpModule = typeof import('sharp').default;

let library: SharpModule | null = null;

async function getSharp(): Promise<SharpModule> {
  if (!library) {
    const loaded = (await import('sharp')).default;
    /*
     * Bound the threads used inside a single operation. Without this the limit
     * on how many images encode at once does nothing to bound CPU, because each
     * one spreads across every core on its own.
     */
    loaded.concurrency(LIBVIPS_CONCURRENCY);
    library = loaded;
  }
  return library;
}

/**
 * Encode a small generated image, to prove at startup that the library and the
 * platform binaries under it are present and working. Kept here so it exercises
 * the same loading path a request does.
 */
export async function encodeProbe(): Promise<{
  width: number;
  height: number;
  bytes: number;
}> {
  const sharp = await getSharp();
  const width = 32;
  const height = 32;

  const buffer = await sharp({
    create: {width, height, channels: 3, background: {r: 0, g: 0, b: 0}},
  })
    .toFormat(IMAGE_FORMAT, {quality: DEFAULT_IMAGE_QUALITY})
    .toBuffer();

  return {width, height, bytes: buffer.byteLength};
}

/*
 * Limit how many images are encoded at once, and how many may be waiting.
 *
 * Encoding is CPU-bound and the imaging library runs its own threads per
 * operation, so a page of cold thumbnails would otherwise start as many encodes
 * as it has images and leave nothing for serving requests. Past the queue length
 * the caller is turned away and serves the file whole instead of waiting behind
 * work that may already have outlived the readers who asked for it.
 */
let running = 0;
const waiting: Array<() => void> = [];

async function withSlot<T>(work: () => Promise<T>): Promise<T | null> {
  if (
    running >= MAX_CONCURRENT_RESIZES &&
    waiting.length >= MAX_WAITING_RESIZES
  ) {
    return null;
  }

  /*
   * Re-check after waking. A caller arriving between a slot being released and
   * the woken waiter resuming would otherwise take that slot as well, and both
   * would proceed.
   */
  while (running >= MAX_CONCURRENT_RESIZES) {
    await new Promise<void>(resolve => waiting.push(resolve));
  }
  running++;
  try {
    return await work();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

/*
 * Encodes in progress, by cache key. A thumbnail appearing many times on a page
 * arrives as many simultaneous requests for one derivative; without this each
 * would encode the same image, and all but one of the results would be thrown
 * away.
 */
const inFlight = new Map<string, Promise<Buffer | null>>();

/*
 * Source files to serve as they are — an animation, a format we do not render,
 * one too large to be worth decoding, or one the library refused.
 *
 * Remembered because the alternative is repeating the same doomed work on every
 * request for the life of the file: a photo carrying a colour profile the
 * decoder complains about is not rare, and without this each view of the page it
 * sits on pays for a full decode that ends in the same error.
 *
 * Keyed by contents, so replacing the file reconsiders it. A file recorded here
 * after a passing failure is served whole until the process restarts, which is
 * the price of not reconsidering the permanent ones forever.
 */
const bypassed = new Set<string>();
const MAX_REMEMBERED_BYPASSES = 1024;

function rememberBypass(source: string): void {
  if (bypassed.size >= MAX_REMEMBERED_BYPASSES) {
    bypassed.delete(bypassed.values().next().value!);
  }
  bypassed.add(source);
}

/**
 * A resized copy of the file, and the tag that identifies it.
 *
 * `held` says the copy already exists, which lets a caller answer a viewer who
 * says they have it without producing or reading anything. `read` produces it,
 * and returns null when the file turns out to be one to serve whole after all.
 */
export interface Derivative {
  etag: string;
  held: boolean;
  read: () => Promise<Buffer | null>;
}

/**
 * Prepare to serve the file at `width`, or null to serve it whole.
 *
 * Deliberately does no work beyond a `stat`: the tag is derived from the file's
 * identity rather than its contents, so a viewer who already holds the image can
 * be answered before it is read or produced.
 */
export async function resolveDerivative({
  filePath,
  width,
  quality,
}: {
  filePath: string;
  width: number;
  quality: number;
}): Promise<Derivative | null> {
  const stats = await fs.promises.stat(filePath);
  const source = `${filePath}:${stats.size}:${stats.mtimeMs}`;

  if (bypassed.has(source)) return null;

  if (stats.size > MAX_SOURCE_BYTES) {
    rememberBypass(source);
    return null;
  }

  const key = derivativeKey({
    filePath,
    size: stats.size,
    modifiedAt: stats.mtimeMs,
    width,
    quality,
  });

  return {
    etag: key,
    held: await hasDerivative(key),
    read: () => produce({key, source, filePath, width, quality}),
  };
}

async function produce({
  key,
  source,
  filePath,
  width,
  quality,
}: {
  key: string;
  source: string;
  filePath: string;
  width: number;
  quality: number;
}): Promise<Buffer | null> {
  const cached = await readDerivative(key);
  if (cached) return cached;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const work = withSlot(async () => {
    const buffer = await encode(filePath, width, quality);
    if (!buffer) return null;

    /* Stored while the slot is still held, so the number of full-size buffers in
     * memory stays bounded by the number of encoders. */
    await writeDerivative(key, buffer);
    return buffer;
  })
    .then(buffer => {
      if (!buffer) rememberBypass(source);
      return buffer;
    })
    .catch(error => {
      console.error('[IMAGE] could not resize, serving the file whole:', error);
      rememberBypass(source);
      return null;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, work);
  return work;
}

/**
 * Encode the file, or null when it is one to serve untouched.
 *
 * What the file is comes from its own contents, not from the type recorded
 * against it — a declared type reaches us from whoever uploaded the file and
 * cannot decide whether we hand its bytes to a renderer. The first bytes are
 * read here rather than by the imaging library, because asking that library what
 * a file is already means letting it open the file, which for a vector image
 * means parsing the document we are trying not to parse.
 *
 * An animation is passed through whole rather than encoded: reading it as a
 * still would silently return its first frame, and re-encoding the animation
 * costs far more than the transfer it saves.
 *
 * `withoutEnlargement` keeps a small original from being blown up to the
 * requested width, matching what the framework's own optimisation does. A source
 * narrower than the width asked for therefore comes back at its own size, while
 * the srcset entry still describes it as the wider candidate.
 */
async function encode(
  filePath: string,
  width: number,
  quality: number,
): Promise<Buffer | null> {
  if (await isBypassedFormat(filePath)) return null;

  const sharp = await getSharp();

  const image: Sharp = sharp(filePath, {
    limitInputPixels: MAX_INPUT_PIXELS,
    failOn: 'warning',
    autoOrient: true,
    sequentialRead: true,
  }).timeout({seconds: ENCODE_TIMEOUT_SECONDS});

  const {pages} = await image.metadata();
  if ((pages ?? 1) > 1) return null;

  return image
    .resize({width, withoutEnlargement: true})
    .toFormat(IMAGE_FORMAT, {quality, effort: IMAGE_EFFORT})
    .toBuffer();
}

/** Recognise, from the first bytes alone, a file we will not hand to the encoder. */
async function isBypassedFormat(filePath: string): Promise<boolean> {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const head = Buffer.alloc(SIGNATURE_BYTES);
    const {bytesRead} = await handle.read(head, 0, SIGNATURE_BYTES, 0);
    const start = head.subarray(0, bytesRead);

    return BYPASS_SIGNATURES.some(({matches}) => matches(start));
  } finally {
    await handle.close();
  }
}
