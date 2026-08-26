import fs from 'fs';
import path from 'path';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import type {Client, GooveeClient} from '@/goovee/.generated/client';
import {
  COMMENT_ATTACHMENT_PURPOSE,
  MAX_FILE_SIZE,
} from '@/lib/core/comments/constants';
import {getStoragePath, resolveStoragePath} from '@/storage/index';
import type {ID} from '@/types';
import {
  DEFAULT_RECORD_RETENTION_HOURS,
  DEFAULT_TTL_MS,
  HOUR_MS,
  REAP_BATCH_LIMIT,
} from './constants';
import {
  appendToPart,
  createMetaFile,
  derivePartPath,
  promotePart,
  removePart,
  removeSessionFiles,
} from './file';

// ---- LOCAL IMPORTS ---- //
import {
  FORUM_ATTACHMENT_DOC_MIMES,
  FORUM_POST_ATTACHMENT_PURPOSE,
  MAX_FILE_SIZE as FORUM_MAX_FILE_SIZE,
} from '@/subapps/forum/common/constants';
import {
  PARTNER_PICTURE_MAX_FILE_SIZE,
  PARTNER_PICTURE_PURPOSE,
} from '@/app/[tenant]/[workspace]/account/common/constants';
import {
  MAX_FILE_SIZE as RESOURCE_MAX_FILE_SIZE,
  RESOURCE_DMS_UPLOAD_PURPOSE,
} from '@/subapps/resources/common/constants';
import {MAX_BUNDLE_SIZE} from '@/subapps/marketplace/common/ui/components/versions/version-form/validator';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from '@/subapps/marketplace/common/constants/uploads';

/**
 * Generic, app-agnostic pre-upload mechanism. A file is *staged* before the
 * entity that will own it exists, uploaded in parts so no single request has to
 * carry the whole file and an interrupted transfer resumes where it stopped.
 * Completing a session returns an opaque single-use token (never the `meta_file`
 * id). At submit the consumer *redeems* the token, which re-verifies owner +
 * purpose + freshness and hands back the real id to link.
 *
 * See ./SPEC.md.
 */

export interface UploadPolicy {
  /**
   * Max accepted size in bytes. The purpose is a path segment, so this is known
   * before the request body is read — the route enforces it as a streaming cap,
   * rejecting an oversized upload mid-stream without fully buffering it.
   */
  maxBytes: number;
  /**
   * Optional validation of the materialized file — mime and any custom
   * `.refine()` (image dimensions, magic bytes, filename, …). Size is handled by
   * `maxBytes`, so this need not repeat `.max()`. Use the `error` param for
   * friendly messages.
   */
  file?: z.ZodType<File>;
  /** Override the default 24h time-to-live. */
  ttlMs?: number;
}

/**
 * Attachment claims are short-lived: the user is expected to submit shortly
 * after picking, so an upload that is not redeemed becomes reapable within the
 * hour. The allowance covers transferring the file as well as submitting it,
 * which at the sizes these purposes accept leaves the transfer ample room.
 */
const ATTACHMENT_UPLOAD_TTL_MS = 60 * 60 * 1000; // 1h

/**
 * Purpose → upload policy. Each feature registers its own `<app>:<kind>` entry;
 * `maxBytes` caps the upload (enforced as a streaming limit by the route) and
 * the optional `file` schema validates type/content.
 */
export const UPLOAD_PURPOSES = {
  /* Comment attachments — shared by ticketing, news, events, quotations and
   * forum comments. Any file type is accepted, as with the legacy inline
   * upload. */
  [COMMENT_ATTACHMENT_PURPOSE]: {
    maxBytes: MAX_FILE_SIZE,
    ttlMs: ATTACHMENT_UPLOAD_TTL_MS,
  },
  /* Forum post attachments — images and documents, staged on pick and redeemed
   * when the post is created. Restricted to the types the pickers accepted (any
   * image, plus pdf/doc/docx/xls/xlsx); the size cap is enforced server-side
   * while streaming. */
  [FORUM_POST_ATTACHMENT_PURPOSE]: {
    maxBytes: FORUM_MAX_FILE_SIZE,
    ttlMs: ATTACHMENT_UPLOAD_TTL_MS,
    file: z
      .file()
      .refine(
        f =>
          f.type.startsWith('image/') ||
          FORUM_ATTACHMENT_DOC_MIMES.includes(f.type),
        {error: 'Unsupported file type'},
      ),
  },
  /* Profile / company pictures — a single image staged on pick and redeemed
   * when linked to the partner. Restricted to images; the size cap is enforced
   * server-side while streaming. */
  [PARTNER_PICTURE_PURPOSE]: {
    maxBytes: PARTNER_PICTURE_MAX_FILE_SIZE,
    ttlMs: ATTACHMENT_UPLOAD_TTL_MS,
    file: z.file().refine(f => f.type.startsWith('image/'), {
      error: 'Only images are allowed',
    }),
  },
  /* DMS resource files — staged on pick and redeemed when the aOSDMSFile rows
   * are created. Any file type is accepted; the size cap is enforced
   * server-side while streaming. */
  [RESOURCE_DMS_UPLOAD_PURPOSE]: {
    maxBytes: RESOURCE_MAX_FILE_SIZE,
    ttlMs: ATTACHMENT_UPLOAD_TTL_MS,
  },
  /*
   * A `.zip` filename is accepted alongside the zip mimes because some
   * browsers send octet-stream for `.zip`. The same rule is spelled out in
   * `BundleDropzone`'s accept attribute, so a change here needs one there.
   */
  'marketplace:bundle': {
    maxBytes: MAX_BUNDLE_SIZE,
    file: z
      .file()
      .refine(
        file =>
          file.type === 'application/zip' ||
          file.type === 'application/x-zip-compressed' ||
          file.name.toLowerCase().endsWith('.zip'),
        {error: 'Bundle must be a .zip file'},
      ),
  },
  /* Raster formats only: SVG can carry embedded scripts and external refs, so
   * accepting user-supplied SVG here would serve an XSS vector. */
  'marketplace:screenshot': {
    maxBytes: MAX_IMAGE_SIZE,
    file: z.file().mime([...ACCEPTED_IMAGE_TYPES], {
      error: 'Only JPEG, PNG, WebP, GIF, or AVIF images are allowed',
    }),
  },
} satisfies Record<string, UploadPolicy>;

export type UploadPurpose = keyof typeof UPLOAD_PURPOSES;

/** Look up a registered purpose's policy, or undefined if the purpose is unknown. */
export function getUploadPolicy(purpose: string): UploadPolicy | undefined {
  return (UPLOAD_PURPOSES as Record<string, UploadPolicy>)[purpose];
}

/** Display metadata plus the redeem token, returned once a session completes. */
export interface CompletedUpload {
  token: string;
  fileName: string;
  sizeText: string;
  /** Bytes received, so a completing response can still report the offset. */
  size: number;
}

/** What the session looks like to a client asking where to resume from. */
export interface SessionState {
  offset: number;
  length: number;
}

/**
 * Outcome of appending a chunk. Everything other than `ok` is a protocol-level
 * refusal that the route turns into a status code; genuine faults throw.
 */
export type AppendOutcome =
  | {status: 'ok'; offset: number; complete: boolean}
  | {status: 'not-found'}
  | {status: 'complete'}
  | {status: 'conflict'; offset: number}
  | {status: 'too-large'};

/** Outcome of completing a session, once every byte has been received. */
export type FinalizeOutcome =
  | ({status: 'ok'} & CompletedUpload)
  | {status: 'not-found'}
  | {status: 'incomplete'};

/**
 * When a session stops being anybody's business.
 *
 * Set once, when the session opens, and never moved. The purpose's TTL is the
 * whole allowance: time to upload the file *and* submit the record it belongs
 * to. Past it the session is abandoned, whether or not every byte arrived.
 */
function sessionExpiry(policy: UploadPolicy): Date {
  return new Date(Date.now() + (policy.ttlMs ?? DEFAULT_TTL_MS));
}

/*
 * Byte counts are held in columns wide enough for files far larger than any
 * upload policy allows, which the driver hands back as text to keep the full
 * range intact. Every count this module works with is compared and added to, so
 * it is taken as a number at the edge — exact for anything under 2^53 bytes,
 * which no file reaches.
 */
function toBytes(value: string | null | undefined): number {
  return value == null ? 0 : Number(value);
}

/**
 * Open a session for a file that is about to be uploaded. Nothing is written to
 * disk here — the part file appears with the first request that carries a body,
 * so a failed insert cannot leave an unreferenced blob behind.
 *
 * The redeem token is minted now but deliberately *not* returned: the client
 * only receives it once the file is complete and has passed validation, so a
 * token in a caller's hands always refers to a whole file. The session id is
 * the separate, append-only handle, and it is the value that travels in URLs.
 *
 * The caller enforces `uploadLength` against the purpose's `maxBytes` before
 * calling; the per-chunk cap enforces it again on the bytes actually received.
 */
export async function createSession({
  purpose,
  owner,
  client,
  fileName,
  fileType,
  uploadLength,
}: {
  purpose: string;
  owner: ID;
  client: Client;
  fileName: string;
  fileType: string;
  uploadLength: number;
}): Promise<{sessionId: string; offset: number}> {
  const policy = getUploadPolicy(purpose);
  if (!policy) {
    throw new Error(`Unknown upload purpose: ${purpose}`);
  }

  const session = await client.stagedUpload.create({
    data: {
      token: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      purpose,
      owner: {select: {id: owner}},
      fileName,
      fileType,
      partPath: derivePartPath(fileName),
      uploadLength: String(uploadLength),
      uploadOffset: '0',
      expiresAt: sessionExpiry(policy),
    },
    select: {sessionId: true},
  });

  return {sessionId: session.sessionId!, offset: 0};
}

/**
 * Where a session stands, for a client that needs to resume. Scoped to the
 * owner, so one user cannot probe another's sessions.
 */
export async function findSession({
  sessionId,
  owner,
  client,
}: {
  sessionId: string;
  owner: ID;
  client: Client;
}): Promise<SessionState | null> {
  const row = await client.stagedUpload.findOne({
    where: {
      sessionId,
      owner: {id: owner},
      consumedAt: {eq: null},
      reapedAt: {eq: null},
      expiresAt: {gt: new Date()},
    },
    select: {uploadOffset: true, uploadLength: true},
  });

  if (!row) return null;

  return {offset: toBytes(row.uploadOffset), length: toBytes(row.uploadLength)};
}

/**
 * Work out what became of an upload whose commit was refused, and answer the
 * caller for it.
 *
 * The guard only refuses when the upload is no longer the one that was appended
 * to, so the bytes just written belong to nobody until it is known which.
 */
async function reconcileLostAppend({
  sessionId,
  owner,
  client,
  partPath,
}: {
  sessionId: string;
  owner: ID;
  client: Client;
  partPath: string;
}): Promise<AppendOutcome> {
  const current = await client.stagedUpload.findOne({
    where: {sessionId, owner: {id: owner}},
    select: {
      uploadOffset: true,
      partPath: true,
      reapedAt: true,
      metaFile: {id: true},
    },
  });

  /* Completed while this append was running. If this append opened the part
   * after the rename it created a new file under that name, which belongs to
   * nothing; if it opened before, its writes went into the finished file and
   * there is nothing here to undo. Best effort either way — the record is
   * whole, and a failure to tidy up is only a leak. */
  if (current?.metaFile) {
    await removePart(partPath).catch(error => {
      console.error('Stage upload part cleanup failed:', error);
    });
    return {status: 'complete'};
  }

  // still filling, another append simply got there first
  if (current?.partPath && !current.reapedAt) {
    return {status: 'conflict', offset: toBytes(current.uploadOffset)};
  }

  /* Released or reaped meanwhile, so these bytes belong to nothing. The sweep
   * skips a released row, so the part is removed here or not at all — but a
   * failure to remove it must not turn a gone session into a server fault,
   * since the caller's answer is the same either way. */
  await removePart(partPath).catch(error => {
    console.error('Stage upload part cleanup failed:', error);
  });
  return {status: 'not-found'};
}

/*
 * Appends to one upload run one at a time.
 *
 * Two appends to the same part file would interleave their writes with each
 * other's truncation, leaving a file whose byte count looks right and whose
 * contents are not. A caller sending one part at a time never waits here; one
 * that resumes before its abandoned part finished arriving does.
 *
 * An entry lives only while something is queued behind it, so the map does not
 * grow with every upload the process has ever served.
 */
const appendQueue = new Map<string, Promise<unknown>>();

function queueAppend<T>(sessionId: string, run: () => Promise<T>): Promise<T> {
  const previous = appendQueue.get(sessionId) ?? Promise.resolve();

  /* `previous` is a tracked promise, which never rejects, so a failed append
   * cannot hold up the ones behind it. */
  const settled = previous.then(run);
  const tracked = settled.catch(() => undefined);

  appendQueue.set(sessionId, tracked);
  void tracked.then(() => {
    if (appendQueue.get(sessionId) === tracked) appendQueue.delete(sessionId);
  });

  return settled;
}

/**
 * Append one chunk at `offset` and report the new offset.
 *
 * The supplied offset must equal the committed one. Accepting a mismatch would
 * let a caller leave a gap (which reads back as zeros), overwrite bytes already
 * counted, or push the file past its cap, so a mismatch is refused and answered
 * with the authoritative offset to resume from.
 *
 * A part that stops arriving part-way is not lost: whatever landed is made
 * durable and committed, and the answer carries the offset to carry on from.
 *
 * A client is expected to keep one chunk in flight per session. One that does
 * not is made to wait rather than allowed to corrupt its own file.
 */
export function appendChunk(args: {
  sessionId: string;
  owner: ID;
  offset: number;
  stream: ReadableStream<Uint8Array>;
  client: Client;
}): Promise<AppendOutcome> {
  return queueAppend(args.sessionId, () => appendOneChunk(args));
}

async function appendOneChunk({
  sessionId,
  owner,
  offset,
  stream,
  client,
}: {
  sessionId: string;
  owner: ID;
  offset: number;
  stream: ReadableStream<Uint8Array>;
  client: Client;
}): Promise<AppendOutcome> {
  const row = await client.stagedUpload.findOne({
    where: {
      sessionId,
      owner: {id: owner},
      consumedAt: {eq: null},
      reapedAt: {eq: null},
      expiresAt: {gt: new Date()},
    },
    select: {
      purpose: true,
      partPath: true,
      uploadOffset: true,
      uploadLength: true,
      metaFile: {id: true},
    },
  });

  if (!row) return {status: 'not-found'};

  /* Checked before the part file, which is cleared the moment a session
   * completes: a client whose completion response was lost re-sends its last
   * chunk, and must be told the file is already whole rather than that its
   * session has vanished. */
  if (row.metaFile) return {status: 'complete'};
  if (!row.partPath) return {status: 'not-found'};

  const committed = toBytes(row.uploadOffset);
  const length = toBytes(row.uploadLength);

  if (offset !== committed) return {status: 'conflict', offset: committed};

  const policy = getUploadPolicy(row.purpose);
  if (!policy) {
    throw new Error(`Unknown upload purpose: ${row.purpose}`);
  }

  const written = await appendToPart({
    partPath: row.partPath,
    stream,
    offset: committed,
    maxBytes: Math.min(policy.maxBytes, length),
  });

  if (written.status === 'too-large') return {status: 'too-large'};

  /* Fewer durable bytes than the record claimed — the count is corrected down
   * to what survived so the client re-sends from there, rather than a hole
   * being papered over. */
  if (written.status === 'short') {
    const corrected = await client.stagedUpload.updateAll({
      where: {
        sessionId,
        uploadOffset: {eq: String(committed)},
        metaFile: {id: {eq: null}},
        consumedAt: {eq: null},
        reapedAt: {eq: null},
      },
      set: {uploadOffset: String(written.offset)},
    });

    /* The correction is refused on a session that completed meanwhile, whose
     * recorded count is the right one — so the caller is told what the record
     * holds, not what this append found. */
    if (!Number(corrected)) return {status: 'conflict', offset: committed};

    return {status: 'conflict', offset: written.offset};
  }

  /*
   * The part stopped arriving part-way, but what arrived is durable. It is
   * committed under the same guard as a whole part, and the caller is answered
   * with the offset to carry on from rather than being failed — a paused upload
   * then loses only the bytes that were still on the wire.
   */
  if (written.status === 'torn') {
    const salvaged = await client.stagedUpload.updateAll({
      where: {
        sessionId,
        uploadOffset: {eq: String(committed)},
        metaFile: {id: {eq: null}},
        consumedAt: {eq: null},
        reapedAt: {eq: null},
      },
      set: {uploadOffset: String(written.offset)},
    });

    /* Refused because the upload moved on meanwhile — completed, released or
     * reaped while this body drained. Reconciled exactly as an intact part is,
     * so a part file this append re-created under a name that has since been
     * promoted away is not left behind. */
    if (!Number(salvaged))
      return reconcileLostAppend({
        sessionId,
        owner,
        client,
        partPath: row.partPath,
      });

    /* The tear happened after the last byte, so the file is whole and finishes
     * exactly as an intact final part would. */
    if (written.offset === length) {
      return {status: 'ok', offset: written.offset, complete: true};
    }

    return {status: 'conflict', offset: written.offset};
  }

  /* The commit is conditional on the upload still being the one that was
   * appended to: the same offset, not completed, and neither released nor
   * reaped meanwhile. */
  const committedRows = await client.stagedUpload.updateAll({
    where: {
      sessionId,
      uploadOffset: {eq: String(committed)},
      metaFile: {id: {eq: null}},
      consumedAt: {eq: null},
      reapedAt: {eq: null},
    },
    set: {uploadOffset: String(written.offset)},
  });

  if (!Number(committedRows)) {
    return reconcileLostAppend({
      sessionId,
      owner,
      client,
      partPath: row.partPath,
    });
  }

  return {
    status: 'ok',
    offset: written.offset,
    complete: written.offset === length,
  };
}

/**
 * Complete an upload: validate the assembled file, create its `meta_file` row
 * and hand back the redeem token.
 *
 * Validation runs here, on the whole file — mime sniffing and content checks
 * cannot be applied to a part in isolation. A failing schema throws, and the
 * route releases the session in response.
 *
 * The part file is renamed to the name the `meta_file` records, and `partPath`
 * is cleared as the blob changes hands. The row and the `meta_file` commit
 * together, leaving no `meta_file` the reaper could not reach through its
 * record.
 *
 * Completing an already-complete upload returns the same token, so a retried
 * final chunk is harmless.
 */
export async function finalizeSession({
  sessionId,
  owner,
  client,
}: {
  sessionId: string;
  owner: ID;
  client: GooveeClient;
}): Promise<FinalizeOutcome> {
  const row = await client.stagedUpload.findOne({
    where: {
      sessionId,
      owner: {id: owner},
      consumedAt: {eq: null},
      reapedAt: {eq: null},
      expiresAt: {gt: new Date()},
    },
    select: {
      token: true,
      purpose: true,
      fileName: true,
      fileType: true,
      partPath: true,
      uploadOffset: true,
      uploadLength: true,
      metaFile: {id: true, fileName: true, sizeText: true},
    },
  });

  if (!row) return {status: 'not-found'};

  if (row.metaFile) {
    return {
      status: 'ok',
      token: row.token,
      fileName: row.metaFile.fileName ?? row.fileName ?? 'file',
      sizeText: row.metaFile.sizeText ?? '',
      size: toBytes(row.uploadOffset),
    };
  }

  const size = toBytes(row.uploadOffset);
  if (!row.partPath || size !== toBytes(row.uploadLength)) {
    return {status: 'incomplete'};
  }

  const policy = getUploadPolicy(row.purpose);
  if (!policy) {
    throw new Error(`Unknown upload purpose: ${row.purpose}`);
  }

  const fileName = row.fileName ?? 'file';
  const fileType = row.fileType ?? 'application/octet-stream';
  const partPath = row.partPath;

  if (policy.file) {
    /*
     * `fs.openAsBlob` backs the File with the on-disk blob lazily, so mime and
     * size checks read only metadata and a content `.refine()` reads from disk
     * on demand rather than pulling the file into memory.
     */
    const blob = await fs.openAsBlob(path.resolve(getStoragePath(), partPath), {
      type: fileType,
    });
    policy.file.parse(new File([blob], fileName, {type: fileType}));
  }

  /* The finished file takes a name of its own, so an append still running
   * against this session writes to a path that no longer exists. */
  const filePath = await promotePart(partPath);

  const uploaded = await client.$transaction(async txClient => {
    const metaFile = await createMetaFile(
      {fileName, filePath, fileType, size},
      {client: txClient},
    );

    /* The claim is conditional on the session being unclaimed. Completing is
     * already serialised by the rename above — a second caller finds no part
     * file to promote — so this guards the record rather than carrying the
     * whole weight of it. */
    const claimed = await txClient.stagedUpload.updateAll({
      where: {sessionId, metaFile: {id: {eq: null}}, partPath: {ne: null}},
      set: {partPath: null, metaFile: {id: metaFile.id}},
    });

    if (!Number(claimed)) {
      throw new Error('Upload was completed by a concurrent request');
    }

    return metaFile;
  });

  return {
    status: 'ok',
    token: row.token,
    fileName: uploaded.fileName,
    sizeText: uploaded.sizeText,
    size,
  };
}

/**
 * Discard a session the caller has abandoned, freeing its disk at once instead
 * of leaving it until the expiry sweep. Only ever an optimisation: a client that
 * closes, crashes or loses the network never sends it, so the reaper reclaims
 * every session on expiry regardless of whether this is called.
 *
 * A session that has already completed is left alone — its blob belongs to a
 * `meta_file` by then, and may already have been redeemed.
 */
export async function releaseSession({
  sessionId,
  owner,
  client,
}: {
  sessionId: string;
  owner: ID;
  client: Client;
}): Promise<void> {
  const row = await client.stagedUpload.findOne({
    where: {
      sessionId,
      owner: {id: owner},
      consumedAt: {eq: null},
      reapedAt: {eq: null},
    },
    select: {partPath: true, metaFile: {id: true}},
  });

  if (!row?.partPath || row.metaFile) return;

  /*
   * The record gives up the files before they are deleted, and only while it
   * still holds them. The read above is a moment old; this update is not, so an
   * upload that completed in between keeps the blob it took over rather than
   * having it deleted out from under a committed `meta_file`.
   *
   * A delete that then fails leaves a file nothing can name. That is a leak, and
   * it is logged.
   */
  const released = await client.stagedUpload.updateAll({
    where: {
      sessionId,
      owner: {id: owner},
      partPath: {ne: null},
      metaFile: {id: {eq: null}},
      consumedAt: {eq: null},
      reapedAt: {eq: null},
    },
    set: {partPath: null, reapedAt: new Date()},
  });

  if (!Number(released)) return;

  await removeSessionFiles(row.partPath);
}

/**
 * Release a session on a path that is already failing. Reclaiming storage must
 * not become the error the caller sees, so a failure here is logged and the
 * session left to the expiry sweep, which would have collected it anyway.
 */
export async function releaseSessionQuietly(args: {
  sessionId: string;
  owner: ID;
  client: Client;
}): Promise<void> {
  await releaseSession(args).catch(error => {
    console.error('Stage upload release error:', error);
  });
}

/**
 * Redeem a staged upload at submit time: atomically consume the claim and return
 * the linked `meta_file` id. The consume is a compare-and-set on the row version
 * (`update` emits `WHERE id=? AND version=?`), so a concurrent redeem loses the
 * race and the ORM throws an optimistic-lock error — left to propagate.
 *
 * Call this inside the consumer's own `$transaction` (pass `txClient`) and link
 * the returned id in the same transaction, so any throw rolls the consume back.
 * The consumer keeps its own ownership checks on the target entity — this proves
 * only that the caller staged this file for this purpose.
 */
export async function redeemUpload({
  token,
  purpose,
  owner,
  client,
}: {
  token: string;
  purpose: string;
  owner: ID;
  client: Client;
}): Promise<ID> {
  const row = await client.stagedUpload.findOne({
    where: {
      token,
      purpose,
      owner: {id: owner},
      consumedAt: {eq: null},
      expiresAt: {gt: new Date()},
    },
    select: {version: true, metaFile: {id: true}},
  });

  // not found / wrong owner|purpose / expired / already consumed — indistinguishable
  if (!row?.metaFile) {
    throw new Error('Upload not redeemable');
  }

  await client.stagedUpload.update({
    data: {id: row.id, version: row.version, consumedAt: new Date()},
  });

  return row.metaFile.id;
}

/**
 * Periodic cleanup of *abandoned* uploads — unconsumed sessions past their expiry
 * that were never redeemed. Reclaims storage, then marks the session `reapedAt`
 * and clears its links, KEEPING the row for traceability. The prune pass removes
 * the row itself once it is past the record-retention window. Scheduled per
 * tenant by the reaper in `instrumentation.ts` (see `./startup`).
 *
 * Two shapes are abandoned. A session whose upload never finished holds a part
 * file and no `meta_file`, so only the part is deleted. A session that completed
 * but was never redeemed holds a `meta_file`, whose blob and row both go.
 *
 * This sweep is the only guarantee that storage is reclaimed. An abandoning
 * client may release its session explicitly, but one that is closed, crashes or
 * loses the network never does, so nothing here depends on that having happened
 * — expiry alone drives it.
 *
 * NEVER touches consumed sessions — their `meta_file` is attached to a real
 * entity and deleting it is live data loss.
 *
 * Reaps at most `REAP_BATCH_LIMIT` sessions per call; a larger backlog drains over
 * later runs. Already-reaped rows (`reapedAt` set) are excluded by the query, so
 * each is processed once. Each session is reaped independently: an already-gone
 * blob or a transient DB error on one is counted in `failed` and skipped,
 * never aborting the rest of the sweep — the next run retries it.
 */
export async function reapExpiredUploads({
  client,
}: {
  client: GooveeClient;
}): Promise<{reaped: number; failed: number}> {
  const abandoned = await client.stagedUpload.find({
    where: {
      consumedAt: {eq: null},
      reapedAt: {eq: null},
      expiresAt: {lt: new Date()},
    },
    take: REAP_BATCH_LIMIT,
    select: {
      version: true,
      partPath: true,
      metaFile: {id: true, version: true, filePath: true},
    },
  });

  let reaped = 0;
  let failed = 0;
  for (const row of abandoned) {
    try {
      /*
       * Mark the row reaped, unlink the meta_file (clearing the FK), and delete
       * the now-unreferenced meta_file — in one transaction, and before a byte
       * is removed from disk. A session completing alongside this sweep takes
       * its blob out of reach that way, instead of having it deleted from under
       * a committed `meta_file`. The row itself is kept for traceability and
       * removed later by the prune pass.
       */
      await client.$transaction(async txClient => {
        await txClient.stagedUpload.update({
          data: {
            id: row.id,
            version: row.version,
            reapedAt: new Date(),
            partPath: null,
            metaFile: {select: {id: null}},
          },
        });
        if (row.metaFile) {
          await txClient.aOSMetaFile.delete({
            id: row.metaFile.id,
            version: row.metaFile.version,
          });
        }
      });

      /* An unfinished session owns its files outright; once finalized the blob
       * belongs to the meta_file and is removed through that instead. */
      if (row.partPath) {
        await removeSessionFiles(row.partPath);
      }

      const recordedPath = row.metaFile?.filePath;
      const filePath =
        recordedPath && resolveStoragePath(getStoragePath(), recordedPath);

      if (filePath) {
        await fs.promises.rm(filePath, {force: true});
      } else if (recordedPath) {
        console.error(
          `Staged upload ${row.id} records a path outside the storage directory; leaving the file untouched.`,
        );
      }

      reaped++;
    } catch (error) {
      failed++;
      console.error(
        `[UPLOAD][REAP] failed to reap staged upload ${row.id}:`,
        error,
      );
    }
  }

  return {reaped, failed};
}

/**
 * Periodic cleanup: delete staged-upload *records* that have been terminal —
 * consumed or reaped — for longer than the record-retention window. The row is
 * kept until then as a traceability trail, then garbage-collected so the table
 * does not grow without bound. Scheduled alongside `reapExpiredUploads` by the
 * reaper in `instrumentation.ts`.
 *
 * Removes the staged-upload row ONLY. A consumed row's `meta_file` is linked to a
 * real entity (live data) and is untouched; a reaped row's `meta_file` is already
 * gone. With no per-row side effect, this is a single bulk delete; it returns the
 * number of rows removed.
 */
export async function pruneStaleUploads({
  client,
}: {
  client: Client;
}): Promise<{pruned: number}> {
  /*
   * Retention overridable in hours via `UPLOAD_RECORD_RETENTION_HOURS`; unset,
   * non-positive, or invalid falls back to the default — a negative value would
   * otherwise push the cutoff into the future and prune every terminal record.
   * `<field> < cutoff` excludes non-terminal rows for free: a NULL `consumedAt`
   * or `reapedAt` is never less than the cutoff, so it never matches.
   */
  const retentionHours = Number(process.env.UPLOAD_RECORD_RETENTION_HOURS);
  const retentionMs =
    (retentionHours > 0 ? retentionHours : DEFAULT_RECORD_RETENTION_HOURS) *
    HOUR_MS;
  const cutoff = new Date(Date.now() - retentionMs);

  const pruned = await client.stagedUpload.deleteAll({
    where: {OR: [{consumedAt: {lt: cutoff}}, {reapedAt: {lt: cutoff}}]},
  });

  return {pruned: Number(pruned)};
}
