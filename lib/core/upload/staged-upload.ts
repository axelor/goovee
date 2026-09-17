import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import type {Client, GooveeClient} from '@/goovee/.generated/client';
import {COMMENT_ATTACHMENT_PURPOSE, MAX_FILE_SIZE} from '@/comments/constants';
import {
  StoreKeyError,
  StoreStateError,
  type FileStore,
  type WriteState,
} from '@/storage/index';
import type {ID} from '@/types';
import {
  DEFAULT_RECORD_RETENTION_HOURS,
  DEFAULT_TTL_MS,
  HOUR_MS,
  REAP_BATCH_LIMIT,
} from './constants';
import {limitStream} from '@/security/request-body';
import {createMetaFile, deriveStoreKey} from './file';

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
  MARKETPLACE_BUNDLE_PURPOSE,
  MARKETPLACE_SCREENSHOT_PURPOSE,
  MAX_IMAGE_SIZE,
} from '@/subapps/marketplace/common/constants/uploads';

/**
 * Generic, app-agnostic pre-upload mechanism. A file is *staged* before the
 * entity that will own it exists, uploaded in pieces so no single request has
 * to carry the whole file and an interrupted transfer resumes where it
 * stopped.
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
   * Optional check run when the session opens, so an unwanted file costs no
   * transfer.
   *
   * Both fields arrive in request headers, so neither is evidence about the
   * bytes: a file declaring `image/png` and carrying anything satisfies this. A
   * purpose whose safety depends on what a file contains needs that where the
   * file is served — nothing here ever holds a whole file to inspect.
   */
  declared?: z.ZodType<DeclaredFile>;
  /**
   * Override the default 24h time-to-live.
   *
   * A value above the default obliges an edit to the lifecycle-rule figure in
   * CONFIGURATION.md and migrations/object-storage.md, which state the window a
   * bucket needs as a number of hours. An operator cannot read this field, so
   * the number there is the only form of it they have.
   */
  ttlMs?: number;
}

/** What a client states about a file when it opens a session for one. */
export type DeclaredFile = {
  name: string;
  type: string;
};

/** The shape a purpose's `declared` check refines. */
export function declaredFile(): z.ZodType<DeclaredFile> {
  return z.object({name: z.string(), type: z.string()});
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
 * the optional `declared` schema refuses a file by what the client says it is.
 *
 * A Map, not an object, so a lookup cannot reach `Object.prototype`: indexing
 * an object with `constructor` or `__proto__` returns a truthy non-policy,
 * which reads as satisfying every check the policy is there to enforce.
 */
const UPLOAD_PURPOSES = new Map<string, UploadPolicy>([
  /* Comment attachments — shared by ticketing, news, events, quotations and
   * forum comments. Any file type is accepted, as with the legacy inline
   * upload. */
  [
    COMMENT_ATTACHMENT_PURPOSE,
    {
      maxBytes: MAX_FILE_SIZE,
      ttlMs: ATTACHMENT_UPLOAD_TTL_MS,
    },
  ],
  /* Forum post attachments — images and documents, staged on pick and redeemed
   * when the post is created. Restricted to the types the pickers accepted (any
   * image, plus pdf/doc/docx/xls/xlsx); the size cap is enforced server-side
   * while streaming. */
  [
    FORUM_POST_ATTACHMENT_PURPOSE,
    {
      maxBytes: FORUM_MAX_FILE_SIZE,
      ttlMs: ATTACHMENT_UPLOAD_TTL_MS,
      declared: declaredFile().refine(
        ({type}) =>
          type.startsWith('image/') ||
          FORUM_ATTACHMENT_DOC_MIMES.includes(type),
        {error: 'Unsupported file type'},
      ),
    },
  ],
  /* Profile / company pictures — a single image staged on pick and redeemed
   * when linked to the partner. Restricted to images; the size cap is enforced
   * server-side while streaming. */
  [
    PARTNER_PICTURE_PURPOSE,
    {
      maxBytes: PARTNER_PICTURE_MAX_FILE_SIZE,
      ttlMs: ATTACHMENT_UPLOAD_TTL_MS,
      declared: declaredFile().refine(({type}) => type.startsWith('image/'), {
        error: 'Only images are allowed',
      }),
    },
  ],
  /* DMS resource files — staged on pick and redeemed when the aOSDMSFile rows
   * are created. Any file type is accepted; the size cap is enforced
   * server-side while streaming. */
  [
    RESOURCE_DMS_UPLOAD_PURPOSE,
    {
      maxBytes: RESOURCE_MAX_FILE_SIZE,
      ttlMs: ATTACHMENT_UPLOAD_TTL_MS,
    },
  ],
  /*
   * A `.zip` filename is accepted alongside the zip mimes because some
   * browsers send octet-stream for `.zip`. The same rule is spelled out in
   * `BundleDropzone`'s accept attribute, so a change here needs one there.
   */
  [
    MARKETPLACE_BUNDLE_PURPOSE,
    {
      maxBytes: MAX_BUNDLE_SIZE,
      declared: declaredFile().refine(
        ({name, type}) =>
          type === 'application/zip' ||
          type === 'application/x-zip-compressed' ||
          name.toLowerCase().endsWith('.zip'),
        {error: 'Bundle must be a .zip file'},
      ),
    },
  ],
  /* Raster formats only, because SVG carries scripts and external references.
   * The declared type is the client's own word, so this turns away a mistake
   * rather than an attempt: whatever keeps a script in a screenshot from running
   * has to be how the file is served, not this. */
  [
    MARKETPLACE_SCREENSHOT_PURPOSE,
    {
      maxBytes: MAX_IMAGE_SIZE,
      declared: declaredFile().refine(
        ({type}) => (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type),
        {error: 'Only JPEG, PNG, WebP, GIF, or AVIF images are allowed'},
      ),
    },
  ],
]);

/** Look up a registered purpose's policy, or undefined if the purpose is unknown. */
export function getUploadPolicy(purpose: string): UploadPolicy | undefined {
  return UPLOAD_PURPOSES.get(purpose);
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
 * Outcome of appending a piece. Everything other than `ok` is a protocol-level
 * refusal that the route turns into a status code; genuine faults throw.
 */
export type AppendOutcome =
  | {status: 'ok'; offset: number; complete: boolean}
  | {status: 'not-found'}
  | {status: 'complete'}
  | {status: 'conflict'; offset: number};

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
 * The store's bookkeeping, as text.
 *
 * A `String` field, because the count and the state are written together in one
 * statement, and `updateAll` — which is what makes that one statement a
 * compare-and-set — does not resolve a lazy field. `JSON` and `Text` are both
 * generated lazily (`select: false`), so either would silently take `{}` there.
 * Nothing queries into the state, so a field that could be queried buys nothing
 * either, and the column it generates — a `varchar` of no stated length — holds
 * far more than the longest state a file can produce.
 */
function parseStoreState(value: string | null | undefined): WriteState | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as WriteState;
  } catch {
    /* Raised as the refusal a store gives for a state of the wrong shape: both
     * mean the bookkeeping cannot be read, so a caller handles one thing. */
    throw new StoreStateError(value);
  }
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
  store,
  fileName,
  fileType,
  uploadLength,
}: {
  purpose: string;
  owner: ID;
  client: Client;
  store: FileStore;
  fileName: string;
  fileType: string;
  uploadLength: number;
}): Promise<{sessionId: string; offset: number}> {
  const policy = getUploadPolicy(purpose);
  if (!policy) {
    throw new Error(`Unknown upload purpose: ${purpose}`);
  }

  /* Refused before a byte is accepted rather than after every byte has been. */
  if (policy.declared) {
    policy.declared.parse({name: fileName, type: fileType});
  }

  const storeKey = deriveStoreKey(fileName);
  const write = await store.openWrite(storeKey, {contentType: fileType});

  /* The store's bookkeeping goes in with the insert, so nothing it stages is
   * ever left with no row naming it. */
  const session = await client.stagedUpload.create({
    data: {
      token: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      purpose,
      owner: {select: {id: owner}},
      fileName,
      fileType,
      storeKey,
      storeState: JSON.stringify(write.state),
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
}: {
  sessionId: string;
  owner: ID;
  client: Client;
}): Promise<AppendOutcome> {
  const current = await client.stagedUpload.findOne({
    where: {sessionId, owner: {id: owner}},
    select: {
      uploadOffset: true,
      storeKey: true,
      reapedAt: true,
      metaFile: {id: true},
    },
  });

  /* Completed while this append was running: the file is whole and its record
   * names it. What this append staged is left alone, since a store assembling
   * the same key from its own pieces may still be doing so, and taking those
   * away mid-assembly loses a file every byte of which arrived. */
  if (current?.metaFile) return {status: 'complete'};

  // still filling, another append simply got there first
  if (current?.storeKey && !current.reapedAt) {
    return {status: 'conflict', offset: toBytes(current.uploadOffset)};
  }

  /* Released or reaped meanwhile, so these bytes belong to nothing — and are
   * not necessarily gone, since this append may have staged after the release
   * aborted the write it found. Left to the store's sweep, which is what
   * reaches staged bytes no record names. */
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
 * An entry lives only while an append of its own is in hand, so the map does
 * not grow with every upload the process has ever served.
 */
/* Keyed by tenant and session, because `sessionId` is only unique within one
 * tenant's own table — two tenants could otherwise serialise against each
 * other's appends. */
const appendQueue = new Map<string, Promise<unknown>>();

function queueAppend<T>(key: string, run: () => Promise<T>): Promise<T> {
  const previous = appendQueue.get(key) ?? Promise.resolve();

  /* `previous` is a tracked promise, which never rejects, so a failed append
   * cannot hold up the ones behind it. */
  const settled = previous.then(run);
  const tracked = settled.catch(() => undefined);

  appendQueue.set(key, tracked);
  void tracked.then(() => {
    if (appendQueue.get(key) === tracked) appendQueue.delete(key);
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
export function appendChunk({
  tenantId,
  ...args
}: {
  tenantId: string;
  sessionId: string;
  owner: ID;
  offset: number;
  body: ReadableStream<Uint8Array>;
  client: Client;
  store: FileStore;
}): Promise<AppendOutcome> {
  return queueAppend(`${tenantId}:${args.sessionId}`, () =>
    appendOneChunk(args),
  );
}

async function appendOneChunk({
  sessionId,
  owner,
  offset,
  body,
  client,
  store,
}: {
  sessionId: string;
  owner: ID;
  offset: number;
  body: ReadableStream<Uint8Array>;
  client: Client;
  store: FileStore;
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
      storeKey: true,
      storeState: true,
      uploadOffset: true,
      uploadLength: true,
      metaFile: {id: true},
    },
  });

  if (!row) return {status: 'not-found'};

  /* Checked before the store, whose write is given up the moment a session
   * completes: a client whose completion response was lost re-sends its last
   * chunk, and must be told the file is already whole rather than that its
   * session has vanished. */
  if (row.metaFile) return {status: 'complete'};
  const state = parseStoreState(row.storeState);

  if (!row.storeKey || !state) return {status: 'not-found'};

  const committed = toBytes(row.uploadOffset);
  const length = toBytes(row.uploadLength);

  if (offset !== committed) return {status: 'conflict', offset: committed};

  const write = await store.resumeWrite(row.storeKey, state);

  /*
   * The store is the authority on how many bytes it holds, and the record is
   * brought to it either way rather than bytes being laid at a position neither
   * agrees on.
   *
   * Behind the store — a piece whose commit was refused, a body that tore after
   * staging what it had — the client is sent forward past bytes it has already
   * delivered. Ahead of it — a scratch directory cleared — the count comes down
   * and those bytes are sent again. Correcting only downward would lay a later
   * piece past bytes nothing counted.
   */
  if (write.offset !== committed) {
    const corrected = await client.stagedUpload.updateAll({
      where: {
        sessionId,
        uploadOffset: {eq: String(committed)},
        metaFile: {id: {eq: null}},
        consumedAt: {eq: null},
        reapedAt: {eq: null},
      },
      set: {
        uploadOffset: String(write.offset),
        storeState: JSON.stringify(write.state),
      },
    });

    /* Refused on a session that moved on meanwhile, whose own record is the
     * right one — so the caller is told what the record holds. */
    if (!Number(corrected)) {
      return reconcileLostAppend({sessionId, owner, client});
    }

    /* Every byte already arrived, so there is nothing left to send: the file is
     * whole and completes exactly as an intact final piece would. */
    if (write.offset === length) {
      return {status: 'ok', offset: write.offset, complete: true};
    }

    return {status: 'conflict', offset: write.offset};
  }

  const policy = getUploadPolicy(row.purpose);
  if (!policy) {
    throw new Error(`Unknown upload purpose: ${row.purpose}`);
  }

  /* Counted as it passes, so a piece carrying more than the file has left to
   * receive is refused rather than handed to the store. */
  await write.append(
    limitStream(body, Math.min(policy.maxBytes, length) - committed),
  );

  /* Conditional on the upload still being the one that was appended to: the
   * same offset, not completed, and neither released nor reaped meanwhile. The
   * store's bookkeeping is recorded with the count, so the two cannot disagree
   * about which write the bytes went to. */
  const committedRows = await client.stagedUpload.updateAll({
    where: {
      sessionId,
      uploadOffset: {eq: String(committed)},
      metaFile: {id: {eq: null}},
      consumedAt: {eq: null},
      reapedAt: {eq: null},
    },
    set: {
      uploadOffset: String(write.offset),
      storeState: JSON.stringify(write.state),
    },
  });

  if (!Number(committedRows)) {
    return reconcileLostAppend({sessionId, owner, client});
  }

  return {
    status: 'ok',
    offset: write.offset,
    complete: write.offset === length,
  };
}

/**
 * Complete an upload: assemble the file in the store, create its `meta_file`
 * row and hand back the redeem token.
 *
 * The store makes the file visible under the key the `meta_file` records, and
 * `storeState` is cleared as the file changes hands. The row and the `meta_file`
 * commit together, leaving no `meta_file` the reaper could not reach through its
 * record.
 *
 * Completing an already-complete upload returns the same token, so a retried
 * final piece — or an explicit ask to finish — is harmless.
 */
export async function finalizeSession({
  sessionId,
  owner,
  client,
  store,
}: {
  sessionId: string;
  owner: ID;
  client: GooveeClient;
  store: FileStore;
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
      fileName: true,
      fileType: true,
      storeKey: true,
      storeState: true,
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
  const state = parseStoreState(row.storeState);

  if (!row.storeKey || !state) return {status: 'incomplete'};
  if (size !== toBytes(row.uploadLength)) return {status: 'incomplete'};

  const fileName = row.fileName ?? 'file';
  const fileType = row.fileType ?? 'application/octet-stream';
  const filePath = row.storeKey;

  const write = await store.resumeWrite(filePath, state);

  /*
   * The record's count is what says the file is whole; the store's is what it
   * can actually assemble. Fewer there — a scratch directory cleared, a piece
   * that never landed — and the count comes down to what the store holds so the
   * client resumes from it, rather than the store being asked to assemble bytes
   * it does not have.
   */
  if (write.offset < size) {
    await client.stagedUpload.updateAll({
      where: {
        sessionId,
        uploadOffset: {eq: String(size)},
        metaFile: {id: {eq: null}},
        consumedAt: {eq: null},
        reapedAt: {eq: null},
      },
      set: {
        uploadOffset: String(write.offset),
        storeState: JSON.stringify(write.state),
      },
    });

    return {status: 'incomplete'};
  }

  /*
   * The file becomes visible under its key before the record says so.
   *
   * Two callers completing the same session both assemble the same bytes under
   * the same key, so whichever order they land in, the key holds the right
   * file. The claim below is what settles which of them owns it: the loser's
   * transaction rolls back the `meta_file` it made, and its retry reads the
   * winner's and is answered the same token. A loser may not even reach the
   * claim — a rename whose source the winner already moved, or a second
   * completion of one multipart upload, raises here instead.
   *
   * A session interrupted between assembling and claiming leaves a stored file
   * its record does not yet name, which the sweep finds through the key it does
   * record.
   */
  await write.finish({size, contentType: fileType});

  const uploaded = await client
    .$transaction(async txClient => {
      const metaFile = await createMetaFile(
        {fileName, filePath, fileType, size, storeType: store.storeType},
        {client: txClient},
      );

      /* The claim is conditional on the session being unclaimed and still
       * within its life, which is what keeps two callers from both completing it
       * and keeps a session the sweep took over meanwhile from being completed
       * onto a file the sweep has already deleted. */
      const claimed = await txClient.stagedUpload.updateAll({
        where: {
          sessionId,
          metaFile: {id: {eq: null}},
          reapedAt: {eq: null},
          expiresAt: {gt: new Date()},
        },
        set: {storeState: null, metaFile: {id: metaFile.id}},
      });

      if (!Number(claimed)) {
        throw new Error('Upload was completed by a concurrent request');
      }

      return metaFile;
    })
    .catch(async (error: unknown) => {
      await discardUnclaimedFile({sessionId, filePath, client, store});
      throw error;
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
 * Take back a stored file whose claim was refused, unless the session was
 * completed by someone else meanwhile.
 *
 * The file is taken back only once the session can no longer be completed:
 * reaped or gone. Then the sweep has already looked for the key and moved on,
 * and nothing else would ever reclaim it. A session still in progress is left
 * alone whatever refused the claim — another caller completing it first, whose
 * record names this very key since the two assembled the same bytes, or a
 * passing fault, after which a retry assembles the key again and an abandoned
 * session is reclaimed by the sweep through the key it records. Best effort:
 * the caller's error is the one to report, and a file left behind is a leak
 * rather than a fault.
 */
async function discardUnclaimedFile({
  sessionId,
  filePath,
  client,
  store,
}: {
  sessionId: string;
  filePath: string;
  client: Client;
  store: FileStore;
}): Promise<void> {
  /* A row that could not be read is not a row that is gone. The claim may have
   * failed on the very fault that fails this read, while another completion
   * is about to succeed, so an unknown state leaves the file where it is. */
  const current = await client.stagedUpload
    .findOne({
      where: {sessionId},
      select: {reapedAt: true, consumedAt: true, metaFile: {id: true}},
    })
    .catch((error: unknown) => {
      console.error(
        `Stage upload could not re-read session ${sessionId}:`,
        error,
      );
      return undefined;
    });

  const inProgress =
    current && !current.metaFile && !current.reapedAt && !current.consumedAt;

  if (current === undefined || current?.metaFile || inProgress) return;

  await store.delete(filePath).catch(error => {
    console.error(`Stage upload could not discard ${filePath}:`, error);
  });
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
  store,
}: {
  sessionId: string;
  owner: ID;
  client: Client;
  store: FileStore;
}): Promise<void> {
  /* `consumedAt` is what keeps the release below away from a file that has been
   * redeemed: past that point the bytes belong to a record, and the write this
   * would abort is nobody's to abort. */
  const row = await client.stagedUpload.findOne({
    where: {
      sessionId,
      owner: {id: owner},
      consumedAt: {eq: null},
      reapedAt: {eq: null},
    },
    select: {storeKey: true, storeState: true, metaFile: {id: true}},
  });

  const state = parseStoreState(row?.storeState);

  if (!row || row.metaFile || !row.storeKey || !state) return;

  /*
   * The staged bytes go first, before the record gives the write up, so a
   * failure here leaves the row for the expiry sweep to retry instead of
   * stranding what the store holds behind a record that no longer names it.
   * Safe ahead of the claim below because it touches only what was staged: a
   * completion racing this has either already assembled the file, leaving
   * nothing to release, or fails on its next step and commits no `meta_file`.
   */
  const write = await store.resumeWrite(row.storeKey, state);

  await write.abort();

  /*
   * The record gives the write up only while it still holds it. The read above
   * is a moment old; this update is not, so an upload that completed in between
   * keeps the file it took over rather than having it deleted out from under a
   * committed `meta_file`.
   */
  const released = await client.stagedUpload.updateAll({
    where: {
      sessionId,
      owner: {id: owner},
      metaFile: {id: {eq: null}},
      consumedAt: {eq: null},
      reapedAt: {eq: null},
    },
    set: {storeState: null, reapedAt: new Date()},
  });

  if (!Number(released)) return;

  /* The assembled file, in case a completion got that far and its claim never
   * landed. Behind the claim, which is what proves no `meta_file` names it. */
  await store.delete(row.storeKey);
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
  store: FileStore;
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
  store,
}: {
  client: GooveeClient;
  store: FileStore;
}): Promise<{reaped: number; failed: number; swept: number}> {
  const abandoned = await client.stagedUpload.find({
    where: {
      consumedAt: {eq: null},
      reapedAt: {eq: null},
      expiresAt: {lt: new Date()},
    },
    take: REAP_BATCH_LIMIT,
    select: {
      version: true,
      storeKey: true,
      storeState: true,
      metaFile: {id: true, version: true, filePath: true},
    },
  });

  let reaped = 0;
  let failed = 0;
  for (const row of abandoned) {
    try {
      /*
       * An unfinished session owns what the store staged for it outright, and
       * that is released before the record gives up the name it is found by: a
       * release that fails leaves the row unreaped, so the next pass finds it
       * again instead of the bytes being billed forever with nothing naming
       * them. Once finalised the file belongs to the `meta_file` and is removed
       * through that instead.
       */
      try {
        const state = parseStoreState(row.storeState);

        if (row.storeKey && state && !row.metaFile) {
          const write = await store.resumeWrite(row.storeKey, state);

          await write.abort();
        }
      } catch (error) {
        /* Bookkeeping this store cannot read, and a key that names no location
         * in it: neither becomes releasable by trying again, so the row is
         * reaped rather than left. That is what keeps it mortal — a row that
         * never reaches an end is found again on every pass, and the prune
         * pass, which matches only a row that did, never removes it either.
         *
         * Nothing reclaimable is stranded by that. What this store staged on
         * local disk goes to the age sweep below once it is old enough; parts
         * it already shipped to a bucket go to the rule that expires an
         * incomplete multipart, which no sweep here reaches; and a state
         * another store wrote names bytes this one cannot reach at all.
         * Anything else is left to the handler around this loop, which counts
         * the row and leaves the next pass to find it. */
        if (
          !(error instanceof StoreStateError) &&
          !(error instanceof StoreKeyError)
        ) {
          throw error;
        }

        /* Expected where a tenant was moved between providers, which is an
         * operator's own doing, so this is not a fault to be paged about. */
        console.warn(
          `[UPLOAD][REAP] staged upload ${row.id} cannot be released by this store; giving up the record:`,
          error,
        );
      }

      /*
       * Mark the row reaped, unlink the meta_file (clearing the FK), and delete
       * the now-unreferenced meta_file — in one transaction, and before the
       * file itself goes. A session completing alongside this sweep takes its
       * file out of reach that way, instead of having it deleted from under a
       * committed `meta_file`. The row itself is kept for traceability and
       * removed later by the prune pass.
       */
      await client.$transaction(async txClient => {
        await txClient.stagedUpload.update({
          data: {
            id: row.id,
            version: row.version,
            reapedAt: new Date(),
            storeState: null,
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

      /* The key an unfinished session was assembling, in case the file had been
       * assembled but its claim never landed. */
      if (row.storeKey && !row.metaFile && store.accepts(row.storeKey)) {
        await store.delete(row.storeKey);
      }

      const recordedPath = row.metaFile?.filePath;

      if (recordedPath && store.accepts(recordedPath)) {
        await store.delete(recordedPath);
      } else if (recordedPath) {
        console.error(
          `Staged upload ${row.id} records a path outside the file store; leaving the file untouched.`,
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

  /* What the store staged for a write no row names, which nothing above can
   * reach. Swept by age, past the longest a session may live, so a write still
   * being filled is never taken from under its own client. */
  const staleBefore = new Date(Date.now() - longestSessionLife() - HOUR_MS);

  const swept = await store
    .sweepStaged?.(staleBefore)
    .catch((error: unknown) => {
      console.error('[UPLOAD][REAP] staged-file sweep failed:', error);
      return 0;
    });

  return {reaped, failed, swept: swept ?? 0};
}

/** The longest any registered purpose lets a session live. */
function longestSessionLife(): number {
  let longest = DEFAULT_TTL_MS;

  for (const policy of UPLOAD_PURPOSES.values()) {
    longest = Math.max(longest, policy.ttlMs ?? DEFAULT_TTL_MS);
  }

  return longest;
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
  retentionHours,
}: {
  client: Client;
  retentionHours?: number;
}): Promise<{pruned: number}> {
  /*
   * Retention (hours) comes from the tenant's config; unset, non-positive, or
   * invalid falls back to the default — a negative value would otherwise push
   * the cutoff into the future and prune every terminal record.
   * `<field> < cutoff` excludes non-terminal rows for free: a NULL `consumedAt`
   * or `reapedAt` is never less than the cutoff, so it never matches.
   */
  const retentionMs =
    (retentionHours && retentionHours > 0
      ? retentionHours
      : DEFAULT_RECORD_RETENTION_HOURS) * HOUR_MS;
  const cutoff = new Date(Date.now() - retentionMs);

  const pruned = await client.stagedUpload.deleteAll({
    where: {OR: [{consumedAt: {lt: cutoff}}, {reapedAt: {lt: cutoff}}]},
  });

  return {pruned: Number(pruned)};
}
