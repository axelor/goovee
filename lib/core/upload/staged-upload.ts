import fs from 'fs';
import path from 'path';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import type {Client, GooveeClient} from '@/goovee/.generated/client';
import {getStoragePath} from '@/storage/index';
import type {ID} from '@/types';

import {
  DEFAULT_RECORD_RETENTION_HOURS,
  DEFAULT_TTL_MS,
  HOUR_MS,
  REAP_BATCH_LIMIT,
} from './constants';
import {createMetaFile} from './file';

/**
 * Generic, app-agnostic pre-upload mechanism. A file is *staged* before the
 * entity that will own it exists; staging returns an opaque single-use token
 * (never the `meta_file` id). At submit the consumer *redeems* the token, which
 * re-verifies owner + purpose + freshness and hands back the real id to link.
 *
 * See ./SPEC.md (Redmine #113755).
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
 * Purpose → upload policy. Each feature registers its own `<app>:<kind>` entry;
 * `maxBytes` caps the upload (enforced as a streaming limit by the route) and
 * the optional `file` schema validates type/content.
 */
export const UPLOAD_PURPOSES = {
  // 'marketplace:bundle': {
  //   maxBytes: 20 * 1024 * 1024,
  //   file: z.file().mime(['application/zip'], {error: 'Bundle must be a zip'}),
  // },
} satisfies Record<string, UploadPolicy>;

export type UploadPurpose = keyof typeof UPLOAD_PURPOSES;

/** Look up a registered purpose's policy, or undefined if the purpose is unknown. */
export function getUploadPolicy(purpose: string): UploadPolicy | undefined {
  return (UPLOAD_PURPOSES as Record<string, UploadPolicy>)[purpose];
}

/**
 * Stage a file already written to disk by the route: create its `meta_file` row
 * and mint a single-use claim. Returns the opaque token plus display metadata —
 * never the `meta_file` id.
 *
 * The blob is streamed to storage and validated by the route *before* this runs;
 * `stageUpload` only persists the rows. Run it inside the caller's `$transaction`
 * (pass `txClient`) so the `meta_file` row and the claim commit together — a
 * failed claim insert rolls the meta_file back, never leaving a meta_file without
 * an owning claim (which the reaper, scanning claims, could not reclaim).
 *
 * The route owns the on-disk blob: if this throws, the route removes it.
 */
export async function stageUpload({
  purpose,
  owner,
  client,
  fileName,
  filePath,
  fileType,
  size,
}: {
  purpose: string;
  owner: ID;
  client: Client;
  fileName: string;
  filePath: string;
  fileType: string;
  size: number;
}): Promise<{token: string; fileName: string; sizeText: string}> {
  const policy = getUploadPolicy(purpose);
  if (!policy) {
    throw new Error(`Unknown upload purpose: ${purpose}`);
  }

  const expiresAt = new Date(Date.now() + (policy.ttlMs ?? DEFAULT_TTL_MS));

  const uploaded = await createMetaFile(
    {fileName, filePath, fileType, size},
    {client},
  );

  const claim = await client.stagedUpload.create({
    data: {
      token: crypto.randomUUID(),
      purpose,
      owner: {select: {id: owner}},
      metaFile: {select: {id: uploaded.id}},
      expiresAt,
    },
    select: {token: true},
  });

  return {
    token: claim.token,
    fileName: uploaded.fileName,
    sizeText: uploaded.sizeText,
  };
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
 * Periodic cleanup of *abandoned* uploads — unconsumed claims past their expiry
 * that were never redeemed. Reclaims storage by deleting the blob and the
 * `meta_file` row, then marks the claim `reapedAt` and clears its `meta_file`
 * link, KEEPING the claim row for traceability. The prune pass removes the row
 * itself once it is past the record-retention window. Scheduled per tenant by
 * the reaper in `instrumentation.ts` (see `./startup`).
 *
 * NEVER touches consumed claims — their `meta_file` is attached to a real entity
 * and deleting it is live data loss.
 *
 * Reaps at most `REAP_BATCH_LIMIT` claims per call; a larger backlog drains over
 * later runs. Already-reaped rows (`reapedAt` set) are excluded by the query, so
 * each is processed once. Each claim is reaped independently: an already-gone
 * blob or a transient DB error on one claim is counted in `failed` and skipped,
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
      metaFile: {id: true, version: true, filePath: true},
    },
  });

  let reaped = 0;
  let failed = 0;
  for (const row of abandoned) {
    try {
      const filePath = row.metaFile?.filePath;
      if (filePath) {
        await fs.promises.rm(path.resolve(getStoragePath(), filePath), {
          force: true,
        });
      }

      /*
       * Mark the row reaped, unlink the meta_file (clearing the FK), and delete
       * the now-unreferenced meta_file — in one transaction. If the delete
       * fails, `reapedAt` rolls back too, so the next sweep retries the row with
       * its link intact rather than orphaning the meta_file. The claim row
       * itself is kept for traceability and removed later by the prune pass.
       */
      await client.$transaction(async txClient => {
        await txClient.stagedUpload.update({
          data: {
            id: row.id,
            version: row.version,
            reapedAt: new Date(),
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
