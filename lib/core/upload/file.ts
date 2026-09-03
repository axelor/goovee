import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {Readable} from 'stream';
import type {ReadableStream as WebReadableStream} from 'stream/web';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import {resolveStoragePath} from '@/storage/index';
import {getFileSizeText} from '@/utils/files';

/* Every path below is resolved against the acting tenant's storage root, which
 * the caller passes in. There is no process-wide storage path to fall back on:
 * a tenant on a shared AOS keeps its files under its own subdirectory, so a part
 * written against the wrong root assembles into a blob no tenant can read back.
 *
 * `partPath` is confined to that root exactly as a recorded `meta_file.filePath`
 * is. It is a plain column reachable from outside this application, so a value
 * carrying parent-directory segments would otherwise resolve into another
 * tenant's storage — read by the validation step, renamed into this tenant's
 * root on completion, or removed by the retention sweep. */
export function resolvePart(storagePath: string, partPath: string): string {
  const resolved = resolveStoragePath(storagePath, partPath);

  if (!resolved) {
    throw new Error(`Part path is outside the storage directory: ${partPath}`);
  }

  return resolved;
}

/*
 * AOP MetaFile store backend (meta_file.store_type, NOT NULL since AOP 8.0).
 * Goovee writes uploads to the local filesystem, so every meta_file row it
 * creates uses the local store.
 */
export enum MetaFileStoreType {
  LOCAL = 1,
}

/*
 * How much of the original file name a part file's name may carry. The rest of
 * the name is a fixed 51-character prefix, so this keeps the whole thing well
 * inside the 255 bytes filesystems commonly allow.
 */
const MAX_PART_NAME_LENGTH = 120;

export interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  sizeText: string;
}

/** Marks a file that is still being uploaded, and is not yet anyone's data. */
const PART_SUFFIX = '.part';

/**
 * Whether a transfer ended because the other end went away, rather than because
 * anything here failed. A pause, a closed tab and a dropped connection all
 * surface this way, and none of them is a fault worth reporting.
 */
function isDisconnect(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const code = (error as NodeJS.ErrnoException).code;
  return (
    error.name === 'AbortError' ||
    code === 'ERR_STREAM_PREMATURE_CLOSE' ||
    code === 'ECONNRESET' ||
    code === 'ECONNABORTED'
  );
}

/**
 * Pick the on-disk name a chunked upload will append into, relative to the
 * storage directory. Nothing is written here — the file appears with the first
 * request that carries a body, empty or not.
 *
 * The name carries a random component as well as a timestamp. A session stays
 * open across many requests, so two uploads of the same file name must not be
 * able to pick the same path and write over one another.
 */
export function derivePartPath(fileName: string): string {
  /*
   * Sanitize the on-disk name: strip any directory component (path-traversal
   * guard — the name comes from a client header), reduce to safe characters,
   * and bound the length so the generated prefix cannot push the whole name
   * past the filesystem's limit. The original `fileName` is still stored on
   * meta_file for display.
   */
  const safeName = (
    path.basename(fileName).replace(/[^\w.-]+/g, '_') || 'file'
  ).slice(-MAX_PART_NAME_LENGTH);

  return `${Date.now()}-${crypto.randomUUID()}-${safeName}${PART_SUFFIX}`;
}

/** The name a part file takes once it is finished. */
function promotedName(partPath: string): string {
  return partPath.endsWith(PART_SUFFIX)
    ? partPath.slice(0, -PART_SUFFIX.length)
    : partPath;
}

/**
 * Promote a finished part file to the name its `meta_file` will point at, and
 * return that name. The rename is within the storage directory: atomic, and it
 * moves no bytes.
 *
 * This is what keeps two callers from completing the same upload — the second
 * finds nothing to rename. It does **not** protect the finished file from an
 * append that is already running: a file handle follows the file through a
 * rename, so a writer that opened the part beforehand goes on writing into the
 * promoted one. Appends are serialised against each other, but not against
 * this, so completing while one is still arriving remains the caller's to
 * avoid.
 */
export async function promotePart({
  partPath,
  storagePath,
}: {
  partPath: string;
  storagePath: string;
}): Promise<string> {
  const filePath = promotedName(partPath);

  await fs.promises.rename(
    resolvePart(storagePath, partPath),
    resolvePart(storagePath, filePath),
  );

  return filePath;
}

/**
 * Outcome of appending one chunk to a part file.
 *
 * `short` means the file holds fewer bytes than the caller believed were
 * committed, and reports how many are actually there. The append is refused and
 * the caller resumes from that count.
 *
 * `torn` means the part stopped arriving part-way — the caller paused, the
 * connection dropped, a proxy gave up. Whatever did arrive is durable and its
 * count is reported, so the upload carries on from there instead of losing the
 * whole part.
 */
export type PartAppend =
  | {status: 'ok'; offset: number}
  | {status: 'torn'; offset: number}
  | {status: 'short'; offset: number}
  | {status: 'too-large'};

/**
 * Append a chunk to a part file, starting at `offset`, and report the new offset.
 *
 * The file is truncated to `offset` first, discarding whatever a torn write left
 * past the committed count. That truncation only ever shrinks — a file shorter
 * than `offset` is reported as `short`, never padded out to meet it.
 *
 * Bytes go to disk as they arrive off the network and are flushed before the new
 * offset is returned, so a reported offset always describes durable bytes.
 */
export async function appendToPart({
  partPath,
  storagePath,
  stream,
  offset,
  maxBytes,
}: {
  partPath: string;
  storagePath: string;
  stream: ReadableStream<Uint8Array>;
  offset: number;
  maxBytes: number;
}): Promise<PartAppend> {
  const absolute = resolvePart(storagePath, partPath);

  /* A part that is absent holds nothing, which is the same situation as one
   * that is short — both are answered with what is actually durable. */
  const stats = await fs.promises.stat(absolute).catch(() => null);
  const durable = stats ? stats.size : 0;

  if (durable < offset) {
    return {status: 'short', offset: durable};
  }

  const handle = await fs.promises.open(absolute, stats ? 'r+' : 'w');

  let position = offset;
  let interrupted: unknown = null;

  try {
    await handle.truncate(offset);

    /*
     * Only the transfer itself is guarded. Whatever stopped it — the caller
     * pausing, the connection dropping, the disk refusing a write — the bytes
     * already reported as written are the most that can be claimed, and they
     * are flushed below. A flush that then fails propagates, so bytes that
     * could not be made durable are never counted as received.
     */
    try {
      for await (const piece of Readable.fromWeb(
        stream as unknown as WebReadableStream,
      )) {
        if (position + piece.length > maxBytes) {
          await handle.truncate(offset);
          return {status: 'too-large'};
        }

        /*
         * A write can report fewer bytes than it was given, so the piece is
         * written until it is all down rather than once. Moving on after a
         * short write would drop the rest of the piece and lay the next one
         * over the gap, leaving a file whose byte count looks right and whose
         * contents are not. A write that reports no progress at all cannot be
         * retried usefully, so it ends the transfer where it stands.
         */
        let placed = 0;
        while (placed < piece.length) {
          const {bytesWritten} = await handle.write(
            piece,
            placed,
            piece.length - placed,
            position,
          );
          if (bytesWritten === 0) {
            throw new Error(
              `Wrote no bytes to ${partPath} at offset ${position}`,
            );
          }
          placed += bytesWritten;
          position += bytesWritten;
        }
      }
    } catch (error: unknown) {
      interrupted = error;
    }

    await handle.sync();
  } finally {
    await handle.close();
  }

  if (interrupted) {
    /* A caller pausing or navigating away arrives here by the same door as a
     * disk fault, and is the ordinary case — only the rest is worth a line, or
     * routine use would bury the faults that matter. */
    if (!isDisconnect(interrupted)) {
      console.error(
        `Stage upload part ${partPath} stopped at ${position}:`,
        interrupted,
      );
    }
    return {status: 'torn', offset: position};
  }

  return {status: 'ok', offset: position};
}

/**
 * Remove a part file. A part that is already gone is not an error; one that
 * could not be removed is, so callers do not record storage as reclaimed when
 * it was not. The one exception is a path that resolves outside the tenant's
 * storage root: there is nothing here to reclaim, so it is reported and left.
 */
export async function removePart({
  partPath,
  storagePath,
}: {
  partPath: string;
  storagePath: string;
}): Promise<void> {
  /* Cleanup is best effort, and a path that does not belong to this tenant is
   * simply not this sweep's to remove — reported rather than acted on, since a
   * recorded value pointing outside the root is a fault worth seeing. */
  const target = resolveStoragePath(storagePath, partPath);

  if (!target) {
    console.error(
      `Refusing to remove a part outside the storage directory: ${partPath}`,
    );
    return;
  }

  await fs.promises.rm(target, {force: true});
}

/**
 * Remove everything a session may have left on disk: the part file, and the
 * name it is renamed to on completion.
 *
 * A session records only the part name. Completing renames the file before the
 * record can say so, so a session interrupted at that moment leaves a finished
 * file under a name nothing refers to. Clearing up after such a session means
 * looking for both.
 */
export async function removeSessionFiles({
  partPath,
  storagePath,
}: {
  partPath: string;
  storagePath: string;
}): Promise<void> {
  await removePart({partPath, storagePath});
  await removePart({partPath: promotedName(partPath), storagePath});
}

/**
 * Create the `meta_file` row for a blob already assembled on disk.
 *
 * Pass a transaction client (`txClient`) to keep the row creation inside the
 * caller's transaction. `size` is the byte count the file was received with.
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
