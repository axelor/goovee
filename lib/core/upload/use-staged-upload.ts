import {useEffect, useState, useSyncExternalStore} from 'react';
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
   * No-op if the id is unknown, succeeded, in flight, or already queued. A retry
   * may leave an orphan claim server-side if a previous attempt actually reached
   * the server — bounded by the claim TTL + reaper.
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

/*
 * Internal record for one file. The manager keeps a single `Map<id, Task>`; the
 * rendered snapshot and the schedule are derived from it. `xhr` is set only while
 * uploading; `settle` resolves the promise that `upload().done` / `retry()`
 * await, and is cleared once called.
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
  settle?: (result: StagedUpload | null) => void;
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
  private disposed = false;

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

  /** Abort in-flight uploads and stop the scheduler; for unmount. */
  dispose = () => {
    this.disposed = true;
    this.cancelProgress();
    this.tasks.forEach(task => task.xhr?.abort());
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
    task.status = 'queued';
    task.progress = 0;
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
      if (task.status === 'uploading') {
        // the xhr 'abort' event marks it aborted, settles, and re-pumps
        task.xhr?.abort();
      } else if (task.status === 'queued') {
        task.status = 'aborted';
        task.settle?.(null);
        task.settle = undefined;
      }
    };
    if (id) {
      const task = this.tasks.get(id);
      if (task) abortOne(task);
    } else {
      this.tasks.forEach(abortOne);
    }
    this.publish();
  };

  remove = (id: string) => {
    const task = this.tasks.get(id);
    if (!task) return;
    task.xhr?.abort(); // if uploading
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
      task.settle?.(null);
      task.settle = undefined;
    });
    this.tasks.clear();
    this.publish();
  };

  // ---- scheduler ----

  private pump() {
    if (this.disposed) return;
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

    const xhr = new XMLHttpRequest();
    task.xhr = xhr;

    const finish = (result: StagedUpload | null) => {
      task.xhr = undefined;
      task.settle?.(result);
      task.settle = undefined;
      /* Defer so a synchronous failure (below) can't re-enter pump() from inside
       * the current pump loop; async terminal events already run on their own
       * turn, so the microtask is harmless there. */
      queueMicrotask(() => this.pump());
    };

    const fail = (message: string) => {
      task.status = 'error';
      task.error = message;
      this.publish();
      finish(null);
    };

    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable) {
        task.progress = Math.round((event.loaded / event.total) * 100);
        this.scheduleProgress();
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as StagedUpload;
          task.progress = 100;
          task.status = 'success';
          task.token = data.token;
          this.publish();
          finish(data);
        } catch {
          fail('Invalid server response');
        }
      } else {
        fail('Upload could not be staged');
      }
    });

    xhr.addEventListener('error', () => fail('Upload failed'));

    xhr.addEventListener('abort', () => {
      task.status = 'aborted';
      this.publish();
      finish(null);
    });

    try {
      // purpose is a path segment; encode it so values like `marketplace:bundle` round-trip
      const purposeSegment = encodeURIComponent(task.options.purpose);
      xhr.open(
        'POST',
        withBasePath(
          `/api/tenant/${this.tenant}/upload/stage/${purposeSegment}`,
        ),
      );
      /*
       * Send the file as the raw request body so the server streams it straight
       * to disk; the name rides in a header (encoded so unicode round-trips) and
       * the type is the Content-Type.
       */
      xhr.setRequestHeader(
        'Content-Type',
        task.file.type || 'application/octet-stream',
      );
      xhr.setRequestHeader(
        'X-Upload-Filename',
        encodeURIComponent(task.file.name),
      );
      xhr.send(task.file);
    } catch {
      // open/setRequestHeader/send can throw synchronously; route to the terminal
      // path so the task never sticks in 'uploading' and its awaiter settles
      fail('Upload failed');
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
 * A single scheduler starts `queued` tasks up to `concurrency` in flight across
 * every file the hook holds, filling a freed slot as each finishes. Failures are
 * non-terminal: the file is retained so `retry(id)` can re-queue it. In-flight
 * uploads are aborted on unmount.
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

  // abort in-flight uploads and stop the scheduler when the consumer unmounts
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
