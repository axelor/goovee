import 'server-only';

import type {Client} from '@/goovee/.generated/client';
import {getAdapter} from './adapters/registry';
import {
  TASK_KIND,
  PAYMENT_STATUS,
  SESSION_STATUS,
  type Gateway,
} from './domain/types';

/*
 * When a payment's reconcile row is due, and its deadline. Kept
 * apart from the task itself so the settle transaction and the start can
 * write the row without depending on the code that settles.
 */

/** After the handoff stops being payable, before the first look. */
const FIRST_CHECK_GRACE_MS = 5 * 60 * 1000;
/** A session whose provider call never came back has no expiry to wait for. */
const UNSTARTED_WAIT_MS = 30 * 60 * 1000;

export type ReconcileSchedule = {firstCheck: Date; decideAt: Date};

/** How long before a provider that still says pending is asked again. */
export function recheckAfter(gateway: Gateway): number {
  return getAdapter(gateway).reconcile.recheckMs;
}

/**
 * When a session is first looked at, and its deadline, by its provider's own
 * reconcile policy.
 */
export function reconcileSchedule({
  gateway,
  startedOn,
  expiresOn,
}: {
  gateway: Gateway;
  startedOn: Date;
  expiresOn: Date | null;
}): ReconcileSchedule {
  const policy = getAdapter(gateway).reconcile;
  if (policy.timedFrom === 'start') {
    return {
      firstCheck: new Date(startedOn.getTime() + policy.firstCheckAfterMs),
      decideAt: new Date(startedOn.getTime() + policy.decideAfterMs),
    };
  }
  const payableUntil =
    expiresOn?.getTime() ?? startedOn.getTime() + UNSTARTED_WAIT_MS;
  return {
    firstCheck: new Date(payableUntil + FIRST_CHECK_GRACE_MS),
    decideAt: new Date(payableUntil + policy.decideAfterExpiryMs),
  };
}

/**
 * Sets the payment's reconcile row from every session still open, now that
 * one of them knows its handoff: the soonest first check and the soonest
 * deadline among them, so a new session never delays an older one's.
 */
export async function rescheduleFromSessions(
  txClient: Client,
  paymentId: string,
): Promise<void> {
  const sessions = await txClient.aOSPortalPaymentSession.find({
    where: {
      payment: {id: paymentId},
      status: {in: [SESSION_STATUS.initiated, SESSION_STATUS.awaiting]},
    },
    select: {gateway: true, createdOn: true, expiresOn: true},
  });
  const schedules = sessions.map(session =>
    reconcileSchedule({
      gateway: session.gateway as Gateway,
      startedOn: session.createdOn ?? new Date(),
      expiresOn: session.expiresOn ?? null,
    }),
  );
  if (!schedules.length) {
    return;
  }
  const soonest = (dates: Date[]) =>
    new Date(Math.min(...dates.map(date => date.getTime())));
  await scheduleReconcile(
    txClient,
    paymentId,
    {
      firstCheck: soonest(schedules.map(schedule => schedule.firstCheck)),
      decideAt: soonest(schedules.map(schedule => schedule.decideAt)),
    },
    {replace: true},
  );
}

/**
 * Writes or moves the payment's reconcile row. A new session's schedule
 * never delays an earlier one's: the sooner check and deadline stand, unless
 * the row was waiting on a person, whom a fresh attempt relieves. `replace`
 * writes the schedule as given, for a caller that worked it out from every
 * open session.
 */
export async function scheduleReconcile(
  txClient: Client,
  paymentId: string,
  {firstCheck, decideAt}: ReconcileSchedule,
  {replace = false}: {replace?: boolean} = {},
): Promise<void> {
  await txClient.$raw(
    `INSERT INTO portal_portal_payment_task
       (id, version, created_on, payment, kind, next_retry_on, overdue_on, attempts)
     VALUES (nextval('portal_portal_payment_task_seq'), 0, now(), $1, $2, $3, $4, 0)
     ON CONFLICT (payment, kind) DO UPDATE
       SET next_retry_on = CASE
             WHEN $5 OR portal_portal_payment_task.classification = 'needs_decision' THEN EXCLUDED.next_retry_on
             ELSE LEAST(portal_portal_payment_task.next_retry_on, EXCLUDED.next_retry_on) END,
           overdue_on = CASE
             WHEN $5 OR portal_portal_payment_task.classification = 'needs_decision' THEN EXCLUDED.overdue_on
             ELSE LEAST(portal_portal_payment_task.overdue_on, EXCLUDED.overdue_on) END,
           classification = NULL, last_error = NULL, attempts = 0, updated_on = now(),
           version = COALESCE(portal_portal_payment_task.version, 0) + 1`,
    paymentId,
    TASK_KIND.reconcile,
    firstCheck,
    decideAt,
    replace,
  );
}

/**
 * Removes the payment's reconcile row once nothing is left to find out: no
 * session still initiated or awaiting, and nothing funded in part.
 */
export async function dropReconcileIfSettled(
  txClient: Client,
  paymentId: string,
  paymentStatus: string,
): Promise<void> {
  if (paymentStatus === PAYMENT_STATUS.partiallyCaptured) {
    return;
  }
  await txClient.$raw(
    `DELETE FROM portal_portal_payment_task
      WHERE payment = $1 AND kind = $2
        AND NOT EXISTS (
          SELECT 1 FROM portal_portal_payment_session
           WHERE payment = $1 AND status = ANY($3::text[]))`,
    paymentId,
    TASK_KIND.reconcile,
    [SESSION_STATUS.initiated, SESSION_STATUS.awaiting],
  );
}
