import fs from 'fs';
import path from 'path';
import {Readable} from 'stream';
import {pipeline} from 'stream/promises';
import type {ReadableStream as WebReadableStream} from 'stream/web';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import {getStoragePath} from '@/storage/index';
import {getFileSizeText} from '@/utils/files';

/*
 * AOP MetaFile store backend (meta_file.store_type, NOT NULL since AOP 8.0).
 * Goovee writes uploads to the local filesystem, so every meta_file row it
 * creates uses the local store.
 */
export enum MetaFileStoreType {
  LOCAL = 1,
}

export interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  sizeText: string;
}

export interface WrittenFile {
  /** Relative on-disk name under the storage dir. */
  filePath: string;
  /** Actual bytes written — the authoritative size, not the client's claim. */
  size: number;
}

/** Thrown internally when the streaming cap is exceeded; never escapes this module. */
class CapExceededError extends Error {}

/**
 * Stream a web `ReadableStream` to storage under a collision-safe name, capping
 * at `maxBytes`. The body is piped chunk-by-chunk straight to disk — it is never
 * fully buffered in memory. Returns the relative path + actual byte count, or
 * `null` if the cap is exceeded (the partial file is removed first).
 *
 * The caller owns the written file's lifecycle: on any later failure (validation,
 * row creation) it must remove the blob.
 */
export async function writeToStorage(
  stream: ReadableStream<Uint8Array>,
  {fileName, maxBytes}: {fileName: string; maxBytes: number},
): Promise<WrittenFile | null> {
  /*
   * Sanitize the on-disk name: strip any directory component (path-traversal
   * guard — the name comes from a client header) and reduce to safe characters.
   * The original `fileName` is still stored on meta_file for display.
   */
  const safeName = path.basename(fileName).replace(/[^\w.-]+/g, '_') || 'file';
  const timestampFilename = `${Date.now()}-${safeName}`;
  const absolute = path.resolve(getStoragePath(), timestampFilename);

  let size = 0;
  try {
    /*
     * Pipe the request body through a counting passthrough into the write
     * stream. `pipeline` handles backpressure and destroys every stream if any
     * stage throws — so a cap breach tears the whole chain down cleanly.
     */
    await pipeline(
      Readable.fromWeb(stream as unknown as WebReadableStream),
      async function* (source) {
        for await (const chunk of source) {
          size += chunk.length;
          if (size > maxBytes) throw new CapExceededError();
          yield chunk;
        }
      },
      fs.createWriteStream(absolute),
    );
  } catch (error) {
    await fs.promises.rm(absolute, {force: true}).catch(() => {});
    if (error instanceof CapExceededError) return null;
    throw error;
  }

  return {filePath: timestampFilename, size};
}

/**
 * Create the `meta_file` row for a blob already written by `writeToStorage`.
 *
 * Pass a transaction client (`txClient`) to keep the row creation inside the
 * caller's transaction. `size` is the byte count returned by `writeToStorage`.
 */
export async function createMetaFile(
  {
    fileName,
    filePath,
    fileType,
    size,
  }: {fileName: string; filePath: string; fileType: string; size: number},
  {client}: {client: Client},
): Promise<UploadedFile> {
  const metaFile = await client.aOSMetaFile.create({
    data: {
      fileName,
      filePath,
      fileType,
      fileSize: String(size),
      sizeText: getFileSizeText(size),
      storeType: MetaFileStoreType.LOCAL,
    },
    select: {id: true, fileName: true, filePath: true, sizeText: true},
  });

  return {
    id: metaFile.id,
    fileName: metaFile.fileName ?? fileName,
    filePath: metaFile.filePath ?? filePath,
    sizeText: metaFile.sizeText ?? getFileSizeText(size),
  };
}
