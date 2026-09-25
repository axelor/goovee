import 'server-only';

import type {Tenant} from '@/tenant';
import {TASK_KIND, type TaskKind} from './domain/types';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {runInBackground} from '@/locale/server/background';
import {notifyPayment} from './notify';
import {reconcilePayment} from './reconcile';
import {applyManualEntries} from './manual-entries';
import {withdrawUnneededTransfers} from './transfers';

/*
 * The payment tasks goovee runs itself: those that call a provider through the
 * TypeScript adapters, and the confirmations, whose templates, languages and
 * push live here. The ERP registration is AOS's and never claimed here.
 *
 * A task is claimed on a lease and run outside any transaction, since running
 * it means an HTTP call: the claim only moves the task's next attempt past the
 * lease, commits, and the work follows. A process that dies mid-run leaves the
 * task to be claimed again when the lease runs out. A provider call is safe to
 * repeat, being keyed at the provider and in the ledger; a confirmation is
 * not, and is sent again — a second mail rather than none. SKIP LOCKED lets
 * any number of instances run them at once.
 */

/*
 * A task still running past its lease is claimed and run a second time. The
 * confirmation is database work and hand-offs, so only reconcile and the
 * transfer check can run long, on their provider calls. Those calls are keyed
 * or read back first, so a run that overstays repeats reads and settles and
 * never moves money twice.
 */
const LEASE_SECONDS = 15 * 60;
const FIRST_RETRY_SECONDS = 60;
const MAX_RETRY_SECONDS = 60 * 60;
const BATCH_SIZE = 20;

/**
 * What a handler asks of its task once it has run: nothing, and the task is
 * done and removed; or to run again at a later time, as a check that found
 * nothing yet does, with the deadline past which the row is listed under
 * Pending tasks as overdue. A handler that throws is retried with a backoff
 * instead.
 */
export type TaskOutcome = void | {runAgainAt: Date; decideBy?: Date};

type TaskHandler = (args: {
  tenant: Tenant;
  paymentId: string;
}) => Promise<TaskOutcome>;

const HANDLERS: Partial<Record<TaskKind, TaskHandler>> = {
  [TASK_KIND.cancelTransfers]: async ({tenant, paymentId}) => {
    await withdrawUnneededTransfers({tenant, paymentId});
  },
  [TASK_KIND.notify]: async ({tenant, paymentId}) => {
    await notifyPayment({tenant, paymentId});
  },
  [TASK_KIND.reconcile]: ({tenant, paymentId}) =>
    reconcilePayment({tenant, paymentId}),
  [TASK_KIND.applyManualEntries]: async ({tenant, paymentId}) => {
    await applyManualEntries({tenant, paymentId});
  },
};

const GOOVEE_KINDS = Object.keys(HANDLERS);

type ClaimedTask = {
  id: string;
  paymentId: string;
  kind: TaskKind;
  /** How many times the task has been tried, this claim included; sets the backoff. */
  attempt: number;
  /** The row's version this claim set; completing or failing applies only while it holds. */
  version: number;
};

/* The driver hands UPDATE … RETURNING back as `[rows, count]` and a bigint
 * as a string. */
function claimedRows(result: unknown): ClaimedTask[] {
  const rows =
    Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.flatMap((row: unknown): ClaimedTask[] => {
    if (typeof row !== 'object' || row === null) {
      return [];
    }
    const {id, payment, kind, attempts, version} = row as Record<
      string,
      unknown
    >;
    if (id == null || payment == null || typeof kind !== 'string') {
      return [];
    }
    return [
      {
        id: String(id),
        paymentId: String(payment),
        kind: kind as TaskKind,
        attempt: Number(attempts),
        version: Number(version),
      },
    ];
  });
}

async function claim(
  tenant: Tenant,
  paymentId: string | null,
): Promise<ClaimedTask[]> {
  const result = await tenant.client.$raw(
    `UPDATE portal_portal_payment_task AS task
        SET next_retry_on = now() + make_interval(secs => $3),
            attempts = COALESCE(task.attempts, 0) + 1,
            version = COALESCE(task.version, 0) + 1,
            updated_on = now()
      WHERE task.id IN (
        SELECT id FROM portal_portal_payment_task
         WHERE kind = ANY($1::text[])
           AND next_retry_on <= now()
           AND (classification IS NULL OR classification <> 'needs_decision')
           AND ($4::bigint IS NULL OR payment = $4::bigint)
         ORDER BY next_retry_on
         LIMIT $2
         FOR UPDATE SKIP LOCKED)
      RETURNING task.id, task.payment, task.kind, task.attempts, task.version`,
    GOOVEE_KINDS,
    BATCH_SIZE,
    LEASE_SECONDS,
    paymentId,
  );
  return claimedRows(result);
}

/*
 * The batch is claimed at once but run one task after another, so a task late
 * in it may have outlived its lease, and been claimed and run elsewhere, by
 * the time its turn comes. The claim is taken again right before its handler,
 * with a fresh lease; a task whose version moved on since is someone else's now
 * and is skipped. Returns the task under its new version, or null.
 */
async function reclaim(
  tenant: Tenant,
  task: ClaimedTask,
): Promise<ClaimedTask | null> {
  const result = await tenant.client.$raw(
    `UPDATE portal_portal_payment_task
        SET next_retry_on = now() + make_interval(secs => $3),
            version = version + 1,
            updated_on = now()
      WHERE id = $1 AND version = $2
      RETURNING version`,
    task.id,
    task.version,
    LEASE_SECONDS,
  );
  const rows =
    Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
  const row: unknown = Array.isArray(rows) ? rows[0] : null;
  if (typeof row !== 'object' || row === null || !('version' in row)) {
    return null;
  }
  return {...task, version: Number((row as {version: unknown}).version)};
}

/* Keyed on the version this claim set, which only ever grows: a capture that
 * queued the same task again while this one ran moved it on, and that fresh
 * request must still run, even if another claim has taken it since. */
async function complete(
  tenant: Tenant,
  task: ClaimedTask,
  outcome: TaskOutcome,
): Promise<void> {
  if (outcome && 'runAgainAt' in outcome) {
    /* Not a failure: the backoff and the last error start afresh. */
    await tenant.client.$raw(
      `UPDATE portal_portal_payment_task
          SET next_retry_on = $3, overdue_on = COALESCE($4, overdue_on),
              attempts = 0, classification = NULL, last_error = NULL, updated_on = now()
        WHERE id = $1 AND version = $2`,
      task.id,
      task.version,
      outcome.runAgainAt,
      outcome.decideBy ?? null,
    );
    return;
  }
  await tenant.client.$raw(
    `DELETE FROM portal_portal_payment_task WHERE id = $1 AND version = $2`,
    task.id,
    task.version,
  );
}

async function fail(
  tenant: Tenant,
  task: ClaimedTask,
  error: unknown,
): Promise<void> {
  const delay = Math.min(
    FIRST_RETRY_SECONDS * 2 ** Math.max(task.attempt - 1, 0),
    MAX_RETRY_SECONDS,
  );
  const message = error instanceof Error ? error.message : String(error);
  await tenant.client.$raw(
    `UPDATE portal_portal_payment_task
        SET next_retry_on = now() + make_interval(secs => $3),
            classification = 'retryable',
            last_error = $4,
            updated_on = now()
      WHERE id = $1 AND version = $2`,
    task.id,
    task.version,
    delay,
    message.slice(0, 4000),
  );
}

export type TaskRunSummary = {completed: number; failed: number};

/**
 * Runs the due payment tasks goovee owns for one tenant, or only one payment's
 * when a caller has just queued one and wants it done now. A failure is kept
 * on the task with a backoff; nothing here throws for a task that failed.
 */
export async function runPaymentTasks({
  tenant,
  paymentId = null,
}: {
  tenant: Tenant;
  paymentId?: string | null;
}): Promise<TaskRunSummary> {
  const summary: TaskRunSummary = {completed: 0, failed: 0};
  const tasks = await claim(tenant, paymentId);
  for (const claimed of tasks) {
    const handler = HANDLERS[claimed.kind];
    if (!handler) {
      continue;
    }
    const task = await reclaim(tenant, claimed);
    if (!task) {
      continue;
    }
    try {
      /* Every task runs as background work, whether the clock or a request's
       * after() started it: what it translates is for the tenant, not for
       * whoever happened to be browsing. */
      const outcome = await runInBackground(
        {tenant: tenant.id, locale: DEFAULT_LOCALE},
        () => handler({tenant, paymentId: task.paymentId}),
      );
      await complete(tenant, task, outcome);
      summary.completed += 1;
    } catch (error) {
      console.error(
        `[PAYMENT][TASK] ${task.kind} for payment ${task.paymentId} failed:`,
        error,
      );
      await fail(tenant, task, error);
      summary.failed += 1;
    }
  }
  return summary;
}
