import {useEffect, useState, useSyncExternalStore} from 'react';
import {throttle} from 'lodash-es';

// ---- CORE IMPORTS ---- //
import {withBasePath} from '@/lib/core/path/base-path';
import {MAX_UPLOAD_RECOVERIES, UPLOAD_CHUNK_SIZE} from './constants';

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
   * At most `concurrency` uploads run at once across every file the hook holds —
   * all `upload()` calls and retries share one pool, so extras sit in `queued`.
   */
  upload: (
    files: File | File[],
    options: StageOptions,
  ) => {ids: string[]; done: Promise<StagedUpload[]>};
  /**
   * Re-send a failed or aborted item under the same id, reusing the original
   * file and options. It rejoins the shared queue and waits for a free slot.
   * No-op if the id is unknown, succeeded, in flight, or already queued.
   *
   * The upload resumes: the server is asked how much it already holds and only
   * the remainder is sent, so nothing already transferred goes twice. An
   * attempt that failed before it ever learned its file id is the exception —
   * that upload is started again, and the abandoned one is left to expire.
   */
  retry: (id: string) => Promise<StagedUpload | undefined>;
  /**
   * Abort one in-flight upload by id, or all when called with no id. The
   * server-side upload is left in place, so `retry` can pick the file up from
   * where it stopped.
   */
  abort: (id?: string) => void;
  /** Abort (if in-flight), release the server-side upload, and drop the entry. */
  remove: (id: string) => void;
  /** Abort everything and clear all state. */
  reset: () => void;
  /** Tokens of the successfully staged files, in upload order. */
  tokens: string[];
  isUploading: boolean;
}

/*
 * Internal record for one file. The manager keeps a single `Map<id, Task>`; the
 * rendered snapshot and the schedule are derived from it. `xhr` is set only while
 * a chunk is in flight; `settle` resolves the promise that `upload().done` /
 * `retry()` await, and is cleared once called.
 *
 * `fileId` and `offset` survive a failure on purpose: a retry resumes the same
 * server-side upload from the bytes it already holds instead of starting the
 * file again.
 */
interface Task {
  id: string;
  fileName: string;
  file: File;
  options: StageOptions;
  status: StagedUploadStatus;
  progress: number;
  token?: string;
  error?: string;
  xhr?: XMLHttpRequest;
  fileId?: string;
  offset: number;
  settle?: (result: StagedUpload | null) => void;
}

/** The fields a chunk response may carry. All optional — it is server text. */
interface ChunkBody {
  fileId?: string;
  token?: string;
  fileName?: string;
  sizeText?: string;
  offset?: number;
}

/** What one chunk request came back with. */
interface ChunkResponse {
  status: number;
  fileId: string | null;
  offset: number | null;
  body: ChunkBody;
}

/**
 * Narrow a response body to the fields this client uses. The text is whatever
 * the network handed back, so each field is taken only when it has the expected
 * type and dropped otherwise.
 */
function toChunkBody(text: string): ChunkBody {
  if (!text) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {};
  }

  if (typeof parsed !== 'object' || parsed === null) return {};
  const fields = parsed as Record<string, unknown>;

  return {
    fileId: typeof fields.fileId === 'string' ? fields.fileId : undefined,
    token: typeof fields.token === 'string' ? fields.token : undefined,
    fileName: typeof fields.fileName === 'string' ? fields.fileName : undefined,
    sizeText: typeof fields.sizeText === 'string' ? fields.sizeText : undefined,
    offset: typeof fields.offset === 'number' ? fields.offset : undefined,
  };
}

/** Raised when the caller aborted a request, to separate it from a real failure. */
class AbortedError extends Error {}

/** Whole-percent progress, guarding the empty-file case. */
function percentOf(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

/** Project a task down to the public, renderable shape. */
function toItem(task: Task): StagedUploadItem {
  return {
    id: task.id,
    fileName: task.fileName,
    progress: task.progress,
    status: task.status,
    token: task.token,
    error: task.error,
  };
}

/** Shared stable empty snapshot — also the SSR snapshot, so hydration matches. */
const EMPTY: StagedUploadItem[] = [];

/*
 * The upload engine, as a plain external store (no React inside). It owns all
 * mutable state and exposes a `subscribe`/`getSnapshot` pair for
 * `useSyncExternalStore`. Status is the only scheduling signal: `running` is the
 * count of `uploading` tasks and the next work is the first `queued` task in
 * insertion order, so abort/remove just flip status with nothing else to keep in
 * sync. The cached `snapshot` is recomputed only on change, which keeps
 * `getSnapshot` referentially stable (required by `useSyncExternalStore`).
 */
class UploadManager {
  private tasks = new Map<string, Task>();
  private nextId = 0;
  private tenant: string;
  private concurrency: number;

  private listeners = new Set<() => void>();
  private snapshot: StagedUploadItem[] = EMPTY;

  // throttled snapshot for high-frequency progress events
  private scheduleProgress: () => void;
  private cancelProgress: () => void;

  constructor({
    tenant,
    concurrency,
    progressThrottleMs,
  }: {
    tenant: string;
    concurrency: number;
    progressThrottleMs: number;
  }) {
    this.tenant = tenant;
    this.concurrency = Math.max(1, concurrency);

    if (progressThrottleMs > 0) {
      const throttled = throttle(() => this.publish(), progressThrottleMs, {
        leading: true,
        trailing: true,
      });
      this.scheduleProgress = throttled;
      this.cancelProgress = () => throttled.cancel();
    } else {
      const canRaf = typeof requestAnimationFrame !== 'undefined';
      let frame: number | null = null;
      this.scheduleProgress = () => {
        if (!canRaf) return this.publish();
        if (frame != null) return; // a frame is already pending
        frame = requestAnimationFrame(() => {
          frame = null;
          this.publish();
        });
      };
      this.cancelProgress = () => {
        if (frame != null) {
          cancelAnimationFrame(frame);
          frame = null;
        }
      };
    }
  }

  // ---- useSyncExternalStore interface ----

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  getServerSnapshot = () => EMPTY;

  /** Recompute the cached snapshot from current truth and notify subscribers. */
  private publish() {
    this.snapshot = Array.from(this.tasks.values(), toItem);
    this.listeners.forEach(listener => listener());
  }

  // ---- config pushed from the hook when props change ----

  configure = (tenant: string, concurrency: number) => {
    this.tenant = tenant;
    this.concurrency = Math.max(1, concurrency);
    this.pump(); // a raised cap may free a slot
  };

  /**
   * Stop everything under way and give it up; for unmount.
   *
   * Unmounting takes the file ids and offsets with it, so nothing here can ever
   * be resumed — which makes this the moment to release each upload rather than
   * merely stop it. Leaving them would hold their storage until they expired,
   * for uploads no one could pick up again.
   *
   * Stopping goes through `abort()` first, which is what actually holds the
   * scheduler: it settles a file caught between two parts rather than leaving
   * it waiting on an answer that will never come, and the statuses it leaves
   * behind are what stop the driver and keep anything queued from starting.
   */
  dispose = () => {
    this.cancelProgress();
    this.abort();

    /* A file that finished belongs to whatever the consumer staged it for: it
     * is redeemed at submit, or reclaimed by the expiry sweep if the form is
     * never sent. Either way it is not this to give up. */
    this.tasks.forEach(task => {
      if (task.status !== 'success') this.release(task);
    });
  };

  // ---- public API ----

  upload = (files: File | File[], options: StageOptions) => {
    const list = Array.isArray(files) ? files : [files];
    const ids: string[] = [];

    // one pending promise per file, resolved when its task settles; input order
    const results = list.map(file => {
      const id = `u${this.nextId++}`;
      ids.push(id);
      return new Promise<StagedUpload | null>(resolve => {
        this.tasks.set(id, {
          id,
          fileName: file.name,
          file,
          options,
          status: 'queued',
          progress: 0,
          offset: 0,
          settle: resolve,
        });
      });
    });

    this.publish();
    this.pump();

    const done = Promise.all(results).then(staged =>
      staged.filter((result): result is StagedUpload => result != null),
    );

    return {ids, done};
  };

  retry = (id: string) => {
    const task = this.tasks.get(id);
    // only a failed or aborted task can be re-queued
    if (!task || (task.status !== 'error' && task.status !== 'aborted')) {
      return Promise.resolve(undefined);
    }
    /* Progress reflects what the server already holds rather than restarting at
     * zero — a retry resumes the session, it does not re-send the file. */
    task.status = 'queued';
    task.progress = percentOf(task.offset, task.file.size);
    task.error = undefined;
    const result = new Promise<StagedUpload | null>(resolve => {
      task.settle = resolve;
    });
    this.publish();
    this.pump();
    return result.then(staged => staged ?? undefined);
  };

  abort = (id?: string) => {
    const abortOne = (task: Task) => {
      if (task.status !== 'uploading' && task.status !== 'queued') return;

      /*
       * A request that is genuinely in flight is torn down, and its `abort`
       * event marks the task, settles it and re-pumps. Between one part and the
       * next there is nothing to tear down — aborting a finished request raises
       * no event — so the driver is stopped by its status instead, which is
       * what its loop checks before sending anything more.
       */
      const inFlight =
        task.xhr != null && task.xhr.readyState !== XMLHttpRequest.DONE;

      task.status = 'aborted';

      if (inFlight) {
        task.xhr?.abort();
        return;
      }

      task.settle?.(null);
      task.settle = undefined;
    };
    if (id) {
      const task = this.tasks.get(id);
      if (task) abortOne(task);
    } else {
      this.tasks.forEach(abortOne);
    }
    this.publish();

    /* Stopping a file frees its slot. A request that was in flight re-fills it
     * on its way out, but one stopped between two parts has no such moment, and
     * whatever is queued would wait for an unrelated file to finish. */
    this.pump();
  };

  remove = (id: string) => {
    const task = this.tasks.get(id);
    if (!task) return;
    task.xhr?.abort(); // if uploading
    /* The file is being dropped, not paused, so its session is released too —
     * unlike abort(), which leaves the session in place to be resumed. */
    this.release(task);
    task.settle?.(null); // settle any pending awaiter
    task.settle = undefined;
    this.tasks.delete(id);
    this.publish();
    this.pump(); // a removed in-flight upload frees a slot
  };

  reset = () => {
    this.cancelProgress();
    this.tasks.forEach(task => {
      task.xhr?.abort();
      this.release(task);
      task.settle?.(null);
      task.settle = undefined;
    });
    this.tasks.clear();
    this.publish();
  };

  // ---- scheduler ----

  private pump() {
    let running = 0;
    for (const task of this.tasks.values()) {
      if (task.status === 'uploading') running++;
    }
    for (const task of this.tasks.values()) {
      if (running >= this.concurrency) break;
      if (task.status !== 'queued') continue;
      running++;
      this.startTask(task);
    }
  }

  private startTask(task: Task) {
    task.status = 'uploading';
    task.error = undefined;
    this.publish();

    void this.runTask(task);
  }

  private finish(task: Task, result: StagedUpload | null) {
    task.xhr = undefined;
    task.settle?.(result);
    task.settle = undefined;
    /* Defer so a synchronous failure can't re-enter pump() from inside the
     * current pump loop; async terminal events already run on their own turn,
     * so the microtask is harmless there. */
    queueMicrotask(() => this.pump());
  }

  private fail(task: Task, message: string) {
    task.status = 'error';
    task.error = message;
    this.publish();
    this.finish(task, null);
  }

  /* One address per purpose; the upload being worked on rides in a header. */
  private uploadUrl(purpose: string) {
    return withBasePath(
      `/api/tenant/${this.tenant}/upload/stage/${encodeURIComponent(purpose)}`,
    );
  }

  /*
   * One request of the upload. Resolves with the status, the server's offset and
   * the parsed body (when there is one); rejects on transport failure, and with
   * an `AbortedError` when the caller aborted, which the driver treats as a stop
   * rather than an error. `XMLHttpRequest` is used throughout because the Fetch
   * API cannot report upload progress.
   */
  private send(
    task: Task,
    {
      method,
      url,
      headers,
      body,
    }: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body?: Blob;
    },
  ): Promise<ChunkResponse> {
    return new Promise<ChunkResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      task.xhr = xhr;

      /* Progress covers the whole file, not this chunk: what the server has
       * already committed plus what is on the wire right now. */
      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          task.progress = percentOf(task.offset + event.loaded, task.file.size);
          this.scheduleProgress();
        }
      });

      xhr.addEventListener('load', () => {
        const parsed = toChunkBody(xhr.responseText);

        /* The headers are the server's own account of the upload, and are set on
         * every answer; the body repeats them only where it has one. */
        const header = xhr.getResponseHeader('X-File-Offset');
        const reported = header == null ? null : Number(header);
        const offset =
          reported != null && Number.isFinite(reported)
            ? reported
            : (parsed.offset ?? null);
        const fileId =
          xhr.getResponseHeader('X-File-Id') ?? parsed.fileId ?? null;

        resolve({status: xhr.status, fileId, offset, body: parsed});
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));

      xhr.addEventListener('abort', () => {
        task.status = 'aborted';
        this.publish();
        this.finish(task, null);
        reject(new AbortedError());
      });

      try {
        xhr.open(method, url);
        for (const [name, value] of Object.entries(headers)) {
          xhr.setRequestHeader(name, value);
        }
        xhr.send(body);
      } catch {
        // open/setRequestHeader/send can throw synchronously
        reject(new Error('Upload failed'));
      }
    });
  }

  /*
   * Drive one file to completion, a chunk at a time.
   *
   * The first request opens the session and carries the first chunk, so a file
   * that fits in one chunk costs a single round trip. Every later chunk is
   * appended at the offset the server confirmed — never at a locally assumed
   * one, so a resumed upload cannot leave a gap or overlap.
   */
  private async runTask(task: Task) {
    const url = this.uploadUrl(task.options.purpose);

    /*
     * Recovering in place — restarting a session the server has forgotten, or
     * re-seeking to an offset it rejected — is bounded for the whole file. A
     * server that keeps giving the same answer then fails the upload instead of
     * holding it in a loop that neither finishes nor stops.
     */
    let recoveries = 0;
    const recover = () => {
      recoveries++;
      if (recoveries <= MAX_UPLOAD_RECOVERIES) return true;
      this.fail(task, 'Upload could not be staged');
      return false;
    };

    try {
      if (task.fileId && !(await this.resync(task))) return;

      while (task.status === 'uploading') {
        const chunk = task.file.slice(
          task.offset,
          task.offset + UPLOAD_CHUNK_SIZE,
        );
        const opening = !task.fileId;

        const response = opening
          ? await this.send(task, {
              method: 'POST',
              url,
              headers: {
                'Content-Type': 'application/octet-stream',
                'X-File-Name': encodeURIComponent(task.file.name),
                'X-File-Type': task.file.type || 'application/octet-stream',
                'X-File-Size': String(task.file.size),
              },
              body: chunk,
            })
          : await this.send(task, {
              method: 'PATCH',
              url,
              headers: {
                'Content-Type': 'application/octet-stream',
                'X-File-Id': task.fileId!,
                'X-File-Offset': String(task.offset),
              },
              body: chunk,
            });

        /* The server rejected our offset and told us the real one — re-seek and
         * carry on rather than failing the file. */
        if (response.status === 409 && response.offset != null) {
          if (!recover()) return;
          task.offset = response.offset;
          task.progress = percentOf(task.offset, task.file.size);
          this.publish();
          continue;
        }

        /* The session is gone (expired or reclaimed), so there is nothing to
         * resume; the file starts again from the beginning. */
        if (response.status === 404 && !opening) {
          if (!recover()) return;
          task.fileId = undefined;
          task.offset = 0;
          continue;
        }

        /* Only a 2xx counts as the part having landed. A blocked or failed
         * request can surface as status 0, which is not an error code but is
         * certainly not the server having accepted the bytes. */
        if (response.status < 200 || response.status >= 300) {
          return this.fail(
            task,
            response.status === 413
              ? 'File is too large'
              : 'Upload could not be staged',
          );
        }

        if (opening) {
          if (!response.fileId) {
            return this.fail(task, 'Invalid server response');
          }
          task.fileId = response.fileId;
        }

        const advanced = response.offset ?? task.offset + chunk.size;

        /* Termination rests on the offset moving. A success that leaves it where
         * it was would otherwise send the same part forever. */
        if (advanced <= task.offset && !response.body.token) {
          return this.fail(task, 'Upload could not be staged');
        }

        task.offset = advanced;
        task.progress = percentOf(task.offset, task.file.size);

        if (response.body.token) {
          task.progress = 100;
          task.status = 'success';
          task.token = response.body.token;
          this.publish();
          this.finish(task, {
            token: response.body.token,
            fileName: response.body.fileName ?? task.fileName,
            sizeText: response.body.sizeText ?? '',
          });
          return;
        }

        this.publish();
      }
    } catch (error) {
      // an abort has already recorded its own terminal state
      if (error instanceof AbortedError) return;
      this.fail(task, 'Upload failed');
    }
  }

  /*
   * Align the task with what the server holds. Answers false when the caller
   * should stop — either the task is finished with, or it has been failed.
   *
   * A session the server no longer knows about is dropped rather than failed,
   * so the file simply starts again.
   */
  private async resync(task: Task): Promise<boolean> {
    if (!task.fileId) return true;

    let state: ChunkResponse;
    try {
      state = await this.send(task, {
        method: 'HEAD',
        url: this.uploadUrl(task.options.purpose),
        headers: {'X-File-Id': task.fileId},
      });
    } catch (error) {
      if (error instanceof AbortedError) return false;
      this.fail(task, 'Upload failed');
      return false;
    }

    if (state.status === 404) {
      task.fileId = undefined;
      task.offset = 0;
      return true;
    }

    if (state.status >= 400) {
      this.fail(task, 'Upload failed');
      return false;
    }

    if (state.offset != null) {
      task.offset = state.offset;
      task.progress = percentOf(task.offset, task.file.size);
    }

    return true;
  }

  /* Tell the server to drop a session the user walked away from, so its storage
   * is freed at once. Best-effort only — the server reclaims an abandoned
   * session on expiry whether or not this ever arrives. */
  private release(task: Task) {
    /* Whatever the caller does with the entry afterwards, the driver must not
     * keep going against a session that is being thrown away — it would open a
     * fresh one and upload the file the user just discarded. */
    if (task.status === 'uploading' || task.status === 'queued') {
      task.status = 'aborted';
    }

    if (!task.fileId) return;
    const fileId = task.fileId;
    task.fileId = undefined;
    task.offset = 0;
    const xhr = new XMLHttpRequest();
    try {
      xhr.open('DELETE', this.uploadUrl(task.options.purpose));
      xhr.setRequestHeader('X-File-Id', fileId);
      xhr.send();
    } catch {
      // nothing to do: the expiry sweep is the guarantee, not this call
    }
  }
}

/**
 * Generic client hook to pre-upload files via the tenant-scoped stage route,
 * with real per-file upload progress. The work is owned by an `UploadManager`
 * external store (created once per hook instance); the component subscribes to
 * its snapshot via `useSyncExternalStore`. Uses `XMLHttpRequest` because the
 * Fetch API cannot report upload progress.
 *
 * Each file is sent in parts against one server-side session, so no request has
 * to carry a whole file and an interrupted transfer resumes from the bytes the
 * server confirmed. A file that fits in a single part still costs one request.
 *
 * A single scheduler starts `queued` tasks up to `concurrency` in flight across
 * every file the hook holds, filling a freed slot as each finishes. Concurrency
 * is across files: the parts of one file go up in order. Failures are
 * non-terminal: the file is retained so `retry(id)` can resume it. Unmounting
 * releases whatever is still under way, since nothing survives it to resume.
 *
 * `progressThrottleMs > 0` (default 200) uses a fixed throttle; `0` coalesces to
 * one snapshot per animation frame.
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
  const [manager] = useState(
    () => new UploadManager({tenant, concurrency, progressThrottleMs}),
  );

  // push prop changes into the store (the throttle is fixed at construction)
  useEffect(() => {
    manager.configure(tenant, concurrency);
  }, [manager, tenant, concurrency]);

  // release whatever is still under way when the consumer unmounts
  useEffect(() => () => manager.dispose(), [manager]);

  const uploads = useSyncExternalStore(
    manager.subscribe,
    manager.getSnapshot,
    manager.getServerSnapshot,
  );

  const tokens = uploads.flatMap(item =>
    item.status === 'success' && item.token ? [item.token] : [],
  );
  const isUploading = uploads.some(
    item => item.status === 'uploading' || item.status === 'queued',
  );

  return {
    uploads,
    upload: manager.upload,
    retry: manager.retry,
    abort: manager.abort,
    remove: manager.remove,
    reset: manager.reset,
    tokens,
    isUploading,
  };
}
