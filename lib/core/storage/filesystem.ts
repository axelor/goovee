import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {Readable} from 'stream';
import {pipeline} from 'stream/promises';
import {z} from 'zod';

import {writeAll} from './bytes';
import {filesystemRoot, resolveStoragePath} from './paths';
import {isTransferInterrupted} from './transfer';
import {
  MetaFileStoreType,
  StoreKeyError,
  StoreStateError,
  type FileStore,
  type ReadOptions,
  type ResumableWrite,
  type WriteState,
  type StoredFile,
  type WriteOptions,
} from './store';

/*
 * The name of the file a write in progress is building, and the whole of what
 * this store needs to take one up again: the bytes it holds are the file so
 * far, so its length is the offset and there is nothing else to record.
 */
const PartState = z.object({name: z.string().regex(/^[0-9a-f-]{36}$/)});

/**
 * Where a write in progress is gathered: a directory of its own, so that every
 * name in it is one this store generated and the sweep needs nothing to tell
 * staged bytes apart. Staged beside the target instead, a file the visitor
 * named `report.part` would take a key ending in `.part` and be swept.
 *
 * Inside the tenant's root, which keeps the move into place a rename rather
 * than a copy — for both writers here, so it asks that the root be one
 * filesystem and not a tree of mount points.
 */
const STAGING_DIR = '.uploads-in-progress';

/**
 * A file being appended to in place, gathered under a name of this store's own.
 *
 * A filesystem can be appended to, so the bytes are written once and `finish`
 * is a rename rather than a copy.
 */
class FileSystemWrite implements ResumableWrite {
  #offset: number;

  constructor(
    private readonly target: string,
    private readonly staging: string,
    private readonly name: string,
    offset: number,
  ) {
    this.#offset = offset;
  }

  private get temporary(): string {
    return path.join(this.staging, this.name);
  }

  get offset(): number {
    return this.#offset;
  }

  get state(): WriteState {
    return {name: this.name};
  }

  async append(body: Readable): Promise<void> {
    // remade on every piece, since a directory cleared out can be put back
    await fs.promises.mkdir(this.staging, {recursive: true});

    /* Appended rather than written at a position: a write in append mode
     * ignores the position it is given on Linux. */
    const handle = await fs.promises.open(this.temporary, 'a');

    try {
      for await (const chunk of body) {
        await writeAll(handle, chunk as Uint8Array);
      }
    } catch (error) {
      /* The body stopped early. What arrived is kept and counted below; a
       * failure to write is the store's own and is raised. */
      if (!isTransferInterrupted(error)) throw error;
    } finally {
      try {
        /* Flushed before the caller is told how many bytes are held, so a
         * recorded offset never counts bytes a restart would lose. */
        await handle.sync();
        this.#offset = (await handle.stat()).size;
      } finally {
        /* Closed even where the flush failed, which is the disk-full case —
         * one that recurs on every append until something is done about it, so
         * a descriptor left open here would be left open by the hundred. */
        await handle.close();
      }
    }
  }

  async finish({size}: WriteOptions): Promise<void> {
    if (this.#offset !== size) {
      throw new Error(
        `Assembled ${this.#offset} bytes for ${this.target}, expected ${size}; the file was not kept.`,
      );
    }

    // a key naming directories of its own may have none of them yet
    await fs.promises.mkdir(path.dirname(this.target), {recursive: true});

    await fs.promises.rename(this.temporary, this.target);
  }

  async abort(): Promise<void> {
    await fs.promises.rm(this.temporary, {force: true});
  }
}

/**
 * The AOS instance's upload directory, read and written in place.
 *
 * The root is `data.upload.dir` as AOS is configured with it, with the tenant's
 * subdirectory added for a tenant on a shared instance, exactly as AOP's
 * `FileSystemStore` lays it out. Every key resolves inside that root or is
 * refused.
 */
export class FileSystemStore implements FileStore {
  readonly storeType = MetaFileStoreType.FILE_SYSTEM;
  readonly id: string;
  private readonly root: string;
  private readonly staging: string;

  constructor({dir, tenantId}: {dir: string; tenantId: string | undefined}) {
    this.root = filesystemRoot(dir, tenantId);
    this.staging = path.join(this.root, STAGING_DIR);
    this.id = `filesystem:${this.root}`;
  }

  async prepare(): Promise<void> {
    await fs.promises.mkdir(this.staging, {recursive: true});
  }

  /**
   * Everything in the staging directory was put there by this store, so age is
   * the whole of what separates a write nothing names from one still being
   * filled: a write arriving in pieces is written to on every piece, and a
   * whole-body write finishes inside the one call.
   */
  async sweepStaged(before: Date): Promise<number> {
    const directory = await fs.promises
      .opendir(this.staging)
      .catch((error: unknown) => {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      });

    if (!directory) return 0;

    let swept = 0;

    // an entry at a time: the directory's size is not this store's to bound
    for await (const entry of directory) {
      if (!entry.isFile()) continue;

      const file = path.join(this.staging, entry.name);
      const stats = await fs.promises.stat(file).catch(() => null);

      if (!stats?.isFile() || stats.mtimeMs >= before.getTime()) continue;

      await fs.promises.rm(file, {force: true}).catch(() => undefined);
      swept += 1;
    }

    return swept;
  }

  accepts(key: string): boolean {
    return this.locate(key) !== null;
  }

  private resolve(key: string): string {
    const target = this.locate(key);

    if (!target) throw new StoreKeyError(key);

    return target;
  }

  /**
   * Where a key names a file, or null for one that names none.
   *
   * The staging directory is inside the root, so containment alone would admit
   * a key naming it — and a recorded path can reach the database from outside
   * this application. Such a key would let a stored file be assembled over
   * another write's staged bytes, or those bytes be read and deleted as though
   * they were a file. Nothing this application records names it, so it is
   * refused rather than resolved.
   */
  private locate(key: string): string | null {
    const target = resolveStoragePath(this.root, key);

    if (!target) return null;

    return target === this.staging || target.startsWith(this.staging + path.sep)
      ? null
      : target;
  }

  async stat(key: string): Promise<StoredFile | null> {
    const target = this.resolve(key);

    const stats = await fs.promises.stat(target).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    });

    if (!stats?.isFile()) return null;

    /*
     * The file's own identity is part of it as well as its length and time: a
     * file replaced by writing a new one and moving it into place — a restore
     * from backup, a copy that preserves timestamps — can carry the same length
     * and time as the one it replaced.
     */
    return {
      size: stats.size,
      tag: `${stats.ino}-${stats.size}-${stats.mtimeMs}`,
    };
  }

  async read(key: string, {range}: ReadOptions = {}): Promise<Readable> {
    return fs.createReadStream(this.resolve(key), range);
  }

  /**
   * Gathered in the staging directory and renamed into place once whole, so a
   * reader that arrives meanwhile finds either the previous file or the new
   * one, never a part of it. Flushed before the rename, so a file the caller is
   * told about survives a crash that follows.
   *
   * Staged in the same directory as a write that arrives in pieces, so a crash
   * between filling the file and renaming it leaves it where the sweep looks
   * rather than beside the file it was to become.
   */
  async write(
    key: string,
    body: Readable,
    {size}: WriteOptions,
  ): Promise<void> {
    const target = this.resolve(key);
    const temporary = path.join(this.staging, crypto.randomUUID());

    await fs.promises.mkdir(this.staging, {recursive: true});
    await fs.promises.mkdir(path.dirname(target), {recursive: true});

    try {
      /* The write stream owns its descriptor and closes it as the pipeline
       * ends; the file is then reopened to flush it, since a stream offers no
       * way to ask for that before it closes. */
      await pipeline(body, fs.createWriteStream(temporary, {flags: 'wx'}));

      const handle = await fs.promises.open(temporary, 'r+');
      let written: number;

      try {
        await handle.sync();
        written = (await handle.stat()).size;
      } finally {
        await handle.close();
      }

      if (written !== size) {
        throw new Error(
          `Stored ${written} bytes for ${key}, expected ${size}; the file was not kept.`,
        );
      }

      await fs.promises.rename(temporary, target);
    } catch (error) {
      await fs.promises.rm(temporary, {force: true});
      throw error;
    }
  }

  /* Reaches the filesystem for nothing, so the state it returns can be
   * recorded in the same insert that opens the session: the file appears with
   * the first piece that arrives. */
  async openWrite(key: string): Promise<ResumableWrite> {
    return new FileSystemWrite(
      this.resolve(key),
      this.staging,
      crypto.randomUUID(),
      0,
    );
  }

  async resumeWrite(key: string, state: unknown): Promise<ResumableWrite> {
    const target = this.resolve(key);
    const parsed = PartState.safeParse(state);

    if (!parsed.success) throw new StoreStateError(key);

    const {name} = parsed.data;

    /* Absent where the staged file was cleared out from under the write,
     * leaving an offset of zero for the caller to start again from. */
    const held = await fs.promises
      .stat(path.join(this.staging, name))
      .catch((error: unknown) => {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      });

    return new FileSystemWrite(target, this.staging, name, held?.size ?? 0);
  }

  async delete(key: string): Promise<void> {
    await fs.promises.rm(this.resolve(key), {force: true});
  }

  async *list(prefix: string): AsyncIterable<string> {
    const entries = await fs.promises.readdir(this.root, {withFileTypes: true});

    for (const entry of entries) {
      if (entry.isFile() && entry.name.startsWith(prefix)) yield entry.name;
    }
  }
}
