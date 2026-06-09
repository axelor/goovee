import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {throttle} from 'lodash-es';

// ---- CORE IMPORTS ---- //
import {withBasePath} from '@/lib/core/path/base-path';

/** Server response from the stage route — the opaque token, never a meta_file id. */
export interface StagedUpload {
  token: string;
  fileName: string;
  sizeText: string;
}

export type StagedUploadStatus =
  | 'queued'
  | 'uploading'
  | 'success'
  | 'error'
  | 'aborted';

/** Live state for one file being staged. */
export interface StagedUploadItem {
  /** Client-side id, used to track/retry/abort/remove this entry. */
  id: string;
  fileName: string;
  /** Upload progress, 0–100. */
  progress: number;
  status: StagedUploadStatus;
  /** Set once the file is staged; redeemed server-side at submit. */
  token?: string;
  error?: string;
}

interface StageOptions {
  purpose: string;
}

export interface UseStagedUpload {
  /** Live per-file state (one entry per uploaded file). */
  uploads: StagedUploadItem[];
  /**
   * Stage one or many files. Synchronous — returns immediately, before any
   * upload starts, with two channels:
   * - `ids` — one per input file, input-aligned (`ids[i]` ↔ `files[i]`), never
   *   filtered. The stable handle for binding/grouping and for
   *   `abort`/`retry`/`remove`; look an entry up with
   *   `uploads.find(u => u.id === ids[i])`.
   * - `done` — resolves (never rejects) with the tokens that succeeded by the
   *   time this call settled, in input order; failed/aborted items are omitted.
   *   Each item's authoritative, still-evolving status (errors, aborts, later
   *   retries) lives in `uploads`, keyed by the returned ids.
   *
   * At most `concurrency` uploads run at once (extras sit in `queued`).
   */
  upload: (
    files: File | File[],
    options: StageOptions,
  ) => {ids: string[]; done: Promise<StagedUpload[]>};
  /**
   * Re-send a failed or aborted item under the same id, reusing the original
   * file and options. No-op if the id is unknown or still in flight. A retry may
   * leave an orphan claim server-side if a previous attempt actually reached the
   * server — bounded by the claim TTL + reaper.
   */
  retry: (id: string) => Promise<StagedUpload | undefined>;
  /** Abort one in-flight upload by id, or all when called with no id. */
  abort: (id?: string) => void;
  /** Abort (if in-flight) and drop one entry from `uploads`. */
  remove: (id: string) => void;
  /** Abort everything and clear all state. */
  reset: () => void;
  /** Tokens of the successfully staged files, in upload order. */
  tokens: string[];
  isUploading: boolean;
}

/**
 * Generic client hook to pre-upload files via the tenant-scoped stage route,
 * with real per-file upload progress. Uses `XMLHttpRequest` because the Fetch
 * API cannot report upload progress; `xhr.upload.progress` gives the percentage.
 *
 * Handles one file or many: one XHR + one claim token per file, with at most
 * `concurrency` uploads in flight at once (the rest sit in `queued` status). A
 * single-file consumer just reads `uploads[0]` / awaits
 * `const [result] = await upload(file)`.
 *
 * Failures are non-terminal: the original file is retained so `retry(id)` can
 * re-send it. In-flight uploads are aborted on unmount.
 *
 * Progress events are coalesced before they hit state: `progressThrottleMs > 0`
 * (default 200) uses a fixed throttle; `0` coalesces to one update per animation
 * frame. Status changes are never throttled.
 */
export function useStagedUpload({
  tenant,
  concurrency = 3,
  progressThrottleMs = 200,
}: {
  tenant: string;
  concurrency?: number;
  progressThrottleMs?: number;
}): UseStagedUpload {
  const [uploads, setUploads] = useState<StagedUploadItem[]>([]);
  const xhrsRef = useRef<Map<string, XMLHttpRequest>>(new Map());
  // original file + options per item, kept so failed/aborted items can be retried
  const sourcesRef = useRef<Map<string, {file: File; options: StageOptions}>>(
    new Map(),
  );
  /*
   * Mirror of each item's status, readable synchronously inside callbacks and
   * the pool worker (where the `uploads` state would be a stale closure). Kept
   * in sync by `patch` on every status change; removed on `remove`/`reset`.
   */
  const statusRef = useRef<Map<string, StagedUploadStatus>>(new Map());

  // latest progress per id, awaiting the next throttled flush
  const pendingProgressRef = useRef<Map<string, number>>(new Map());
  // monotonic counter for client-only item ids (unique within this hook instance)
  const nextIdRef = useRef(0);

  const patch = useCallback(
    (id: string, changes: Partial<StagedUploadItem>) => {
      if (changes.status !== undefined) {
        statusRef.current.set(id, changes.status);
      }
      setUploads(prev =>
        prev.map(item => (item.id === id ? {...item, ...changes} : item)),
      );
    },
    [],
  );

  // apply buffered progress in one pass; bail out (return prev) if nothing moved
  const applyProgress = useCallback((entries: Map<string, number>) => {
    setUploads(prev => {
      let changed = false;
      const next = prev.map(item => {
        const pct = entries.get(item.id);
        if (pct == null || pct === item.progress) return item;
        changed = true;
        return {...item, progress: pct};
      });
      return changed ? next : prev;
    });
  }, []);

  /*
   * Scheduler that drains buffered progress into one render. `progressThrottleMs
   * > 0` uses a fixed lodash throttle; `0` coalesces to one flush per animation
   * frame (paint-synced, self-tuning — never more than the display can show).
   * Both expose `cancel` for unmount/reset.
   */
  const flusher = useMemo(() => {
    const flush = () => {
      const pending = pendingProgressRef.current;
      if (pending.size === 0) return;
      const snapshot = new Map(pending);
      pending.clear();
      applyProgress(snapshot);
    };

    if (progressThrottleMs > 0) {
      const throttled = throttle(flush, progressThrottleMs, {
        leading: true,
        trailing: true,
      });
      return {schedule: throttled, cancel: () => throttled.cancel()};
    }

    // rAF-coalesce; fall back to immediate where rAF is unavailable (e.g. SSR)
    const canRaf = typeof requestAnimationFrame !== 'undefined';
    let frame: number | null = null;
    const schedule = () => {
      if (!canRaf) return flush();
      if (frame != null) return; // a frame is already pending
      frame = requestAnimationFrame(() => {
        frame = null;
        flush();
      });
    };
    const cancel = () => {
      if (frame != null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
    };
    return {schedule, cancel};
  }, [progressThrottleMs, applyProgress]);

  const reportProgress = useCallback(
    (id: string, pct: number) => {
      pendingProgressRef.current.set(id, pct);
      flusher.schedule();
    },
    [flusher],
  );

  const uploadOne = useCallback(
    (id: string, file: File, options: StageOptions) =>
      new Promise<StagedUpload>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrsRef.current.set(id, xhr);
        patch(id, {status: 'uploading'}); // leaves 'queued' once its turn comes

        const fail = (message: string) => {
          pendingProgressRef.current.delete(id); // drop any buffered progress
          patch(id, {status: 'error', error: message});
          xhrsRef.current.delete(id);
          reject(new Error(message));
        };

        xhr.upload.addEventListener('progress', event => {
          if (event.lengthComputable) {
            reportProgress(id, Math.round((event.loaded / event.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText) as StagedUpload;
              // drop buffered progress so a late throttled flush can't regress 100%
              pendingProgressRef.current.delete(id);
              patch(id, {progress: 100, status: 'success', token: data.token});
              xhrsRef.current.delete(id);
              sourcesRef.current.delete(id); // succeeded — no retry needed
              resolve(data);
            } catch {
              fail('Invalid server response');
            }
          } else {
            fail('Upload could not be staged');
          }
        });

        xhr.addEventListener('error', () => fail('Upload failed'));
        xhr.addEventListener('abort', () => {
          pendingProgressRef.current.delete(id);
          patch(id, {status: 'aborted'});
          xhrsRef.current.delete(id);
          reject(new Error('Upload aborted'));
        });

        // purpose is a path segment; encode it so values like `marketplace:bundle` round-trip
        const purposeSegment = encodeURIComponent(options.purpose);
        xhr.open(
          'POST',
          withBasePath(`/api/tenant/${tenant}/upload/stage/${purposeSegment}`),
        );
        /*
         * Send the file as the raw request body so the server streams it
         * straight to disk; the name rides in a header (encoded so unicode
         * round-trips) and the type is the Content-Type.
         */
        xhr.setRequestHeader(
          'Content-Type',
          file.type || 'application/octet-stream',
        );
        xhr.setRequestHeader(
          'X-Upload-Filename',
          encodeURIComponent(file.name),
        );
        xhr.send(file);
      }),
    [tenant, patch, reportProgress],
  );

  const upload = useCallback(
    (files: File | File[], options: StageOptions) => {
      const list = Array.isArray(files) ? files : [files];
      const items: StagedUploadItem[] = list.map(file => ({
        id: `u${nextIdRef.current++}`,
        fileName: file.name,
        progress: 0,
        status: 'queued',
      }));
      items.forEach((item, index) => {
        sourcesRef.current.set(item.id, {file: list[index], options});
        statusRef.current.set(item.id, 'queued');
      });
      setUploads(prev => [...prev, ...items]);

      const done = (async () => {
        // run at most `concurrency` uploads at once; results keep input order
        const results: (StagedUpload | null)[] = new Array(items.length).fill(
          null,
        );
        let cursor = 0;
        const worker = async () => {
          while (cursor < items.length) {
            const index = cursor++;
            const {id} = items[index];
            // cancelled or removed before it started — skip, no request opened
            if (statusRef.current.get(id) !== 'queued') continue;
            try {
              results[index] = await uploadOne(id, list[index], options);
            } catch {
              // failure/abort is recorded in the item's state
            }
          }
        };
        // clamp to ≥1 so a bad `concurrency` can't leave items stuck queued
        const workers = Math.min(Math.max(1, concurrency), items.length);
        await Promise.all(Array.from({length: workers}, worker));

        return results.filter(
          (result): result is StagedUpload => result != null,
        );
      })();

      return {ids: items.map(item => item.id), done};
    },
    [uploadOne, concurrency],
  );

  const retry = useCallback(
    (id: string) => {
      const source = sourcesRef.current.get(id);
      // unknown id, or still in flight — nothing to retry
      if (!source || xhrsRef.current.has(id)) {
        return Promise.resolve(undefined);
      }
      patch(id, {status: 'uploading', progress: 0, error: undefined});
      return uploadOne(id, source.file, source.options).catch(() => undefined);
    },
    [uploadOne, patch],
  );

  const abort = useCallback(
    (id?: string) => {
      const abortOne = (targetId: string) => {
        const status = statusRef.current.get(targetId);
        if (status === 'uploading') {
          xhrsRef.current.get(targetId)?.abort();
        } else if (status === 'queued') {
          // not started yet — mark aborted so the pool worker skips it
          patch(targetId, {status: 'aborted'});
        }
      };
      if (id) abortOne(id);
      else statusRef.current.forEach((_status, targetId) => abortOne(targetId));
    },
    [patch],
  );

  const remove = useCallback((id: string) => {
    xhrsRef.current.get(id)?.abort();
    xhrsRef.current.delete(id);
    statusRef.current.delete(id); // worker skips ids no longer marked 'queued'
    sourcesRef.current.delete(id);
    pendingProgressRef.current.delete(id);
    setUploads(prev => prev.filter(item => item.id !== id));
  }, []);

  const reset = useCallback(() => {
    flusher.cancel();
    xhrsRef.current.forEach(xhr => xhr.abort());
    xhrsRef.current.clear();
    sourcesRef.current.clear();
    statusRef.current.clear();
    pendingProgressRef.current.clear();
    setUploads([]);
  }, [flusher]);

  // abort any in-flight uploads when the consuming component unmounts
  useEffect(() => {
    const xhrs = xhrsRef.current;
    return () => xhrs.forEach(xhr => xhr.abort());
  }, []);

  // cancel a pending flush on unmount, or when the scheduler changes
  useEffect(() => () => flusher.cancel(), [flusher]);

  const tokens = uploads.flatMap(item =>
    item.status === 'success' && item.token ? [item.token] : [],
  );
  const isUploading = uploads.some(
    item => item.status === 'uploading' || item.status === 'queued',
  );

  return {uploads, upload, retry, abort, remove, reset, tokens, isUploading};
}
