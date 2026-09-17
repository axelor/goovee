import type {Readable} from 'stream';

/*
 * What a file store is, whatever holds the bytes.
 *
 * The portal reads and writes the same files as the AOS instance it serves,
 * through the same kind of store AOP declares (`com.axelor.file.store.Store`):
 * a key — `meta_file.filePath`, relative to the tenant — names a file, and the
 * store decides where that is. The application never learns where; a route
 * serving a download, the staged-upload machinery and the seeders all speak to
 * this interface, and a store for another kind of storage is one more
 * implementation of it registered in ./index.
 */

/**
 * AOP MetaFile store backend, `meta_file.store_type` (NOT NULL since AOP 8.0).
 * Recorded on every row the portal writes, with the value AOP would record for
 * the same store. AOP reads every file through its one active store and never
 * consults the column, so the portal does not either.
 */
export enum MetaFileStoreType {
  FILE_SYSTEM = 1,
  OBJECT_STORAGE = 2,
}

/** The part of a file to read, as byte offsets that both include their end. */
export interface ByteRange {
  start: number;
  end: number;
}

/** What is known about a stored file without reading it. */
export interface StoredFile {
  size: number;
  /**
   * Changes whenever the bytes do, and only then as far as the store can tell —
   * a filesystem's inode, length and modification time; an object's ETag. What
   * a cache and a conditional request compare.
   */
  tag: string;
}

export interface ReadOptions {
  /** Read this stretch of the file rather than the whole of it. */
  range?: ByteRange;
}

export interface WriteOptions {
  /** The file's byte count. A store refuses a file that does not match it. */
  size: number;
  contentType: string;
}

/*
 * What a store records about a write in progress. JSON, because the caller
 * persists it; opaque, because only the store that produced it reads it.
 */
type StateValue =
  | string
  | number
  | boolean
  | null
  | StateValue[]
  | {[key: string]: StateValue};

export type WriteState = {[key: string]: StateValue};

/**
 * A file arriving in pieces, taken up again for each one.
 *
 * The pieces arrive on separate requests, so none of these survives between
 * them: the store is asked for a fresh one each time, from the `state` the last
 * one left.
 */
export interface ResumableWrite {
  /**
   * Bytes of the file the store durably holds, and the authority on where the
   * next piece begins: a caller's own count can be either side of it.
   */
  readonly offset: number;
  /** Read after `append`, which changes it, and persisted by the caller. */
  readonly state: WriteState;
  /**
   * Add the body to the end of the file, resolving once the bytes are durable,
   * so a caller recording `offset` afterwards records bytes that survive a
   * restart. A body that stops part-way keeps what arrived and counts it.
   */
  append(body: Readable): Promise<void>;
  /**
   * Assemble what has arrived into the file under the key, which becomes
   * visible whole. Refuses a file whose length is not `size`.
   */
  finish(options: WriteOptions): Promise<void>;
  /**
   * Give up the file. A write the store no longer knows is not an error.
   *
   * @throws {StoreKeyError} where the key names no location in the store and
   *   the store needs it to release what it holds.
   */
  abort(): Promise<void>;
}

/**
 * A key that does not name a location inside the store: absolute, or escaping
 * the tenant's part of it. Thrown rather than resolved, since a recorded path is
 * data from outside this application and acting on one that escapes would read
 * or delete another tenant's files.
 */
export class StoreKeyError extends Error {
  constructor(key: string) {
    super(`Path is outside the file store: ${key}`);
    this.name = 'StoreKeyError';
  }
}

/**
 * Bookkeeping that cannot be read back: text that is not the shape a store
 * writes, or not JSON at all. The write it describes cannot be taken up again —
 * state left by the other provider before a tenant was moved between them, or
 * by a release that wrote a different shape.
 *
 * Decided from the text alone, so it costs no call and never reports a passing
 * fault as permanent, which is what separates it from a store that is merely
 * unreachable. Trying later cannot help: the bytes it named are held by
 * whatever wrote it.
 */
export class StoreStateError extends Error {
  constructor(detail: string) {
    super(`Write state cannot be read by this store: ${detail}`);
    this.name = 'StoreStateError';
  }
}

export interface FileStore {
  readonly storeType: MetaFileStoreType;
  /**
   * Names what this store holds: two stores with the same id serve the same
   * bytes under the same keys. What a cache keys a file on alongside its key.
   */
  readonly id: string;
  /**
   * One-time setup when the tenant connects: create the root directory, or
   * confirm the bucket is reachable, so a misconfigured store fails there
   * rather than on the first upload.
   */
  prepare(): Promise<void>;
  /**
   * Whether `key` names a location inside this store. A recorded path can carry
   * anything, so a caller checks before it acts on one; the methods below throw
   * `StoreKeyError` for a key this refuses, either at the call or at the first
   * operation that needs the key.
   */
  accepts(key: string): boolean;
  /** Size and change tag of the file, or null where no file has this key. */
  stat(key: string): Promise<StoredFile | null>;
  /** The bytes, or a stretch of them. A missing file surfaces as a stream error. */
  read(key: string, options?: ReadOptions): Promise<Readable>;
  /**
   * Store the body under the key, replacing whatever was there. The file is
   * either whole under its key or absent — a reader never sees a part of it.
   */
  write(key: string, body: Readable, options: WriteOptions): Promise<void>;
  /**
   * Begin a file that will arrive in pieces. Nothing is visible under the key
   * until `finish`. Where the store cannot be appended to, it stages the pieces
   * somewhere of its own choosing; the caller never learns where.
   */
  openWrite(
    key: string,
    options: {contentType: string},
  ): Promise<ResumableWrite>;
  /**
   * Take up the write `state` describes, reading `offset` from the store.
   *
   * @throws {StoreStateError} where the state is not of this store's own shape,
   *   which no retry changes.
   * @throws {StoreKeyError} where the key names no location in the store and
   *   the store needs it here; one that needs it later throws from the write
   *   this returns instead.
   */
  resumeWrite(key: string, state: unknown): Promise<ResumableWrite>;
  /**
   * Discard anything staged for a write last touched before `before`, and
   * report how many were found. The reach for staged bytes no record names —
   * a state never recorded, or given up while a piece was still arriving.
   *
   * `before` has to be older than the longest an upload may live, or a write
   * still being filled is swept from under its own client. Left out only by a
   * store that stages nothing at all.
   */
  sweepStaged?(before: Date): Promise<number>;
  /** Remove the file. A file that is already gone is not an error. */
  delete(key: string): Promise<void>;
  /** Every key opening with the prefix, at the top level of the tenant's part. */
  list(prefix: string): AsyncIterable<string>;
  /**
   * Release whatever the store holds open — a client's sockets — when the
   * tenant it was built for is not going to be used after all. A store with
   * nothing to release leaves it out.
   */
  close?(): void;
}
