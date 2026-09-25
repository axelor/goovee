import 'server-only';

import type {Tenant} from '@/tenant';
import {getAdapter} from './adapters/registry';
import {SessionNotFoundError} from './adapters/types';
import {
  EVENT_TYPE,
  PAYMENT_STATUS,
  SESSION_STATUS,
  type Gateway,
} from './domain/types';
import type {TaskOutcome} from './tasks';
import {triggerRegistration} from './register';
import {fromMinorUnits, scaleOfCurrency} from './domain/money';
import {RECONCILE_GIVE_UP_AFTER_MS} from './domain/transfers';
import {returnedToPayer} from './transfers';
import {recheckAfter, reconcileSchedule} from './reconcile-schedule';
import {closeUnanswered, settlePayment} from './settle';

/*
 * The `reconcile` task: a backstop for a payment its provider never told us
 * the end of — a tab closed before the return, a webhook that never came, a
 * PayPal order approved but never captured. One row per payment, written with
 * the session in T1 and due when the handoff stops being payable, so the
 * providers that rate-limit lookups are asked once per stale payment and never
 * swept. Deleted in T2 once no session is left open.
 *
 * A provider that can be asked is asked, and what it attests is settled like
 * any other event; past the session's deadline it is still asked, daily, until
 * it gives its final answer. One that cannot — Paybox, Up2Pay — is never
 * guessed at: it waits a week for its IPN, then is closed as "no answer",
 * which is not expired or cancelled and lists the payment for finance to
 * check; a late IPN still settles it. A Stripe bank transfer is asked daily
 * for its whole window and cancelled at the provider when the window ends,
 * whatever part of it arrived.
 */

/* Past its deadline a session is still asked, once a day: its provider gives
 * a final answer in the end, and the row stays past its escalation date, so the
 * payment is listed under Pending tasks as overdue meanwhile. */
const DAY_MS = 24 * 60 * 60 * 1000;

const PAST_DEADLINE_RECHECK_MS = DAY_MS;

type OpenSession = {
  id: string;
  gateway: Gateway;
  sessionRef: string | null;
  status: string;
  createdOn: Date;
  expiresOn: Date | null;
  failureReason: string | null;
};

/**
 * The `reconcile` task for one payment. Looks at each session still open, asks
 * the providers that can be asked, settles what they attest, cancels a bank
 * transfer whose window is over, closes as no answer what no provider will
 * answer for, and says when to look again. Never hands the payment to a
 * person.
 */
export async function reconcilePayment({
  tenant,
  paymentId,
}: {
  tenant: Tenant;
  paymentId: string;
}): Promise<TaskOutcome> {
  const {client} = tenant;
  const payment = await client.aOSPortalPayment.findOne({
    where: {id: paymentId},
    select: {reference: true, status: true},
  });
  /* Captured in full: an older session still open is the transfer guard's to
   * withdraw, not a stale payment. */
  if (!payment || payment.status === PAYMENT_STATUS.captured) {
    return;
  }

  const rows = await client.aOSPortalPaymentSession.find({
    where: {payment: {id: paymentId}},
    select: {
      gateway: true,
      sessionRef: true,
      status: true,
      createdOn: true,
      expiresOn: true,
      failureReason: true,
    },
    orderBy: {id: 'ASC'},
  });
  const sessions: OpenSession[] = rows.flatMap(row => {
    /* A session funded in part stays awaiting until it completes or ends. */
    const open =
      row.status === SESSION_STATUS.initiated ||
      row.status === SESSION_STATUS.awaiting;
    return open
      ? [
          {
            id: row.id,
            gateway: row.gateway as Gateway,
            sessionRef: row.sessionRef,
            status: row.status,
            createdOn: row.createdOn ?? new Date(),
            expiresOn: row.expiresOn ?? null,
            failureReason: row.failureReason,
          },
        ]
      : [];
  });
  if (!sessions.length) {
    return;
  }

  const now = Date.now();
  const failures: unknown[] = [];
  const unanswered: {id: string; reason: string | null}[] = [];
  let lookAgainAt: number | null = null;
  /* The soonest deadline among the sessions still waiting, so the row's own
   * escalation date says since when a session has been past its time. */
  let decideBy: number | null = null;
  const lookAgain = (at: number, deadline: Date) => {
    lookAgainAt = lookAgainAt === null ? at : Math.min(lookAgainAt, at);
    decideBy =
      decideBy === null
        ? deadline.getTime()
        : Math.min(decideBy, deadline.getTime());
  };

  /* Nothing else says whose money waits in Stripe: the payment reads
   * cancelled and needs no one. Said whichever way the cancellation reached
   * the ledger, once, when it is first settled. */
  const sayReturned = async (session: OpenSession) => {
    const returned = await returnedToPayer(client, session.id);
    if (returned) {
      console.warn(
        `[PAYMENT][RECONCILE] ${payment.reference}: bank transfer ${session.sessionRef} was cancelled; ${fromMinorUnits(returned.amount, scaleOfCurrency(returned.currencyCode))} ${returned.currencyCode} it had received went back to the payer's Stripe cash balance. Check the balance in Stripe before refunding it: Stripe applies it to the payer's next open transfer.`,
      );
    }
  };

  /* Asked again, daily past the deadline, while the provider has no final
   * word; a month past it, it is not waited on any longer and the session is
   * closed as no answer. Only ever after asking, so a final answer that
   * arrives late still settles. */
  const waitOrGiveUp = (
    session: OpenSession,
    decideAt: Date,
    pastDeadline: boolean,
  ) => {
    if (now >= decideAt.getTime() + RECONCILE_GIVE_UP_AFTER_MS) {
      unanswered.push({
        id: session.id,
        reason: `No final answer from ${session.gateway} ${Math.round(RECONCILE_GIVE_UP_AFTER_MS / DAY_MS)} days past its deadline; look the payment up in the provider's back office by its reference`,
      });
      return;
    }
    lookAgain(
      now +
        (pastDeadline
          ? PAST_DEADLINE_RECHECK_MS
          : recheckAfter(session.gateway)),
      decideAt,
    );
  };

  /* Cancelled at the provider and settled as the provider then reports it.
   * A cancellation or a capture ends the session. Anything else, a transfer
   * the provider still holds open, a settle that changed nothing or a cancel
   * that failed, is looked at again tomorrow and given up on like any other
   * unanswered session. */
  const endTransfer = async (
    session: OpenSession & {sessionRef: string},
    decideAt: Date,
  ) => {
    try {
      const ended = await getAdapter(session.gateway).cancelAwaiting!(
        session.sessionRef,
        {reason: 'abandoned'},
        {tenantId: tenant.id, config: tenant.config},
      );
      const outcome = await settlePayment({signal: ended.signal, tenant});
      if (outcome.outcome === 'settled' && outcome.registrationQueued) {
        await triggerRegistration({tenant, reference: outcome.reference});
      }
      if (outcome.outcome === 'settled') {
        if (ended.signal.type === EVENT_TYPE.cancelled) {
          await sayReturned(session);
        }
        if (
          ended.signal.type === EVENT_TYPE.cancelled ||
          ended.signal.type === EVENT_TYPE.captured
        ) {
          return;
        }
      }
    } catch (error) {
      console.warn(
        `[PAYMENT][RECONCILE] ${payment.reference}: bank transfer ${session.sessionRef} could not be cancelled at the end of its window; tried again tomorrow`,
        error,
      );
      waitOrGiveUp(session, decideAt, true);
      return;
    }
    waitOrGiveUp(session, decideAt, true);
  };

  for (const session of sessions) {
    const {firstCheck, decideAt} = reconcileSchedule({
      gateway: session.gateway,
      startedOn: session.createdOn,
      expiresOn: session.expiresOn,
    });
    if (now < firstCheck.getTime()) {
      lookAgain(firstCheck.getTime(), decideAt);
      continue;
    }
    const pastDeadline = now >= decideAt.getTime();
    const adapter = getAdapter(session.gateway);

    /* Nothing to ask by: closed at the deadline, so it never waits long
     * enough to be given up on. */
    if (!adapter.capabilities.queryable || !session.sessionRef) {
      if (!pastDeadline) {
        lookAgain(decideAt.getTime(), decideAt);
      } else if (
        adapter.capabilities.queryable &&
        adapter.capabilities.chargesOnStart
      ) {
        /* A start that can move money before the payer does anything, as
         * confirming a Stripe bank transfer applies the customer's cash
         * balance at once. With no handle to ask by, it is closed as no
         * answer, with what finance needs to look it up. */
        unanswered.push({
          id: session.id,
          reason: `The ${session.gateway} session was never given a provider handle, and starting it may already have applied the customer's cash balance; look the payment up in the provider's dashboard by its reference`,
        });
      } else {
        /* A form-post provider that sent no IPN in a week, or a start whose
         * handoff never reached the payer — nothing to pay with, since the
         * handle is recorded before the handoff is returned. Closed as no
         * answer, for finance to check, never as expired. */
        unanswered.push({id: session.id, reason: null});
      }
      continue;
    }

    let signal;
    try {
      signal = await adapter.fetchStatus(session.sessionRef, {
        tenantId: tenant.id,
        config: tenant.config,
      });
    } catch (error) {
      /* The provider no longer holds the session: closed as no answer, for
       * finance to check, whatever the deadline — asking again changes
       * nothing. */
      if (error instanceof SessionNotFoundError) {
        unanswered.push({id: session.id, reason: null});
        continue;
      }
      if (pastDeadline) {
        console.warn(
          `[PAYMENT][RECONCILE] ${payment.reference}: ${session.gateway} could not be asked about session ${session.sessionRef}; asked again tomorrow`,
          error,
        );
        waitOrGiveUp(session, decideAt, true);
      } else {
        failures.push(error);
      }
      continue;
    }

    /* A transfer the payer has had its whole window for ends now: cancelled
     * at the provider, whatever part of it arrived. */
    const windowOver =
      pastDeadline &&
      adapter.reconcile.timedFrom === 'start' &&
      Boolean(adapter.cancelAwaiting);

    if (signal.type === 'pending') {
      if (windowOver) {
        await endTransfer(
          {...session, sessionRef: session.sessionRef},
          decideAt,
        );
      } else {
        waitOrGiveUp(session, decideAt, pastDeadline);
      }
      continue;
    }

    const outcome = await settlePayment({signal, tenant});
    if (outcome.outcome === 'settled' && outcome.registrationQueued) {
      await triggerRegistration({tenant, reference: outcome.reference});
    }
    /* The provider answered with something this payment does not hold:
     * another tenant's reference, or none of ours. Asking again changes
     * nothing, so the session is closed as no answer. */
    if (outcome.outcome === 'rejected') {
      unanswered.push({
        id: session.id,
        reason: `${session.gateway} reported the session as ${signal.type}, which names no payment of ours (${outcome.reason}); look it up in the provider's back office`,
      });
      continue;
    }
    /* The provider's event is already recorded on another payment, so this
     * session will never move by it: closed as no answer, naming that
     * payment. */
    if (
      outcome.outcome === 'duplicate' &&
      outcome.recordedOn !== payment.reference
    ) {
      unanswered.push({
        id: session.id,
        reason: `${session.gateway} reported the session as ${signal.type}, which is already recorded on payment ${outcome.recordedOn}; look it up in the provider's back office`,
      });
      continue;
    }
    /* Nothing new was recorded and the session may still be open: looked at
     * again rather than letting the row go under it. */
    if (
      (outcome.outcome === 'duplicate' || outcome.outcome === 'pending') &&
      signal.type !== EVENT_TYPE.partiallyCaptured
    ) {
      waitOrGiveUp(session, decideAt, pastDeadline);
      continue;
    }
    /* A cancellation that reached us by asking, the first time it is seen:
     * after a cancel whose settle failed, or one made at the provider. */
    if (outcome.outcome === 'settled' && signal.type === EVENT_TYPE.cancelled) {
      await sayReturned(session);
    }
    /* Funded in part: the rest may still come, so the transfer is asked
     * again tomorrow, until its window ends; then it is cancelled, and the
     * part that arrived goes back to the payer's cash balance. */
    if (signal.type === EVENT_TYPE.partiallyCaptured) {
      if (windowOver) {
        await endTransfer(
          {...session, sessionRef: session.sessionRef},
          decideAt,
        );
      } else {
        lookAgain(now + recheckAfter(session.gateway), decideAt);
      }
    }
  }

  /* Closed first, so a payment with one session gone quiet and another still
   * waiting has the quiet one out of the way whatever the other comes to.
   * Once no session is left open this also ends the row. */
  if (unanswered.length) {
    await closeUnanswered({tenant, paymentId, sessions: unanswered});
  }

  if (failures.length) {
    throw new AggregateError(
      failures,
      `${failures.length} provider lookups for payment ${payment.reference} failed`,
    );
  }
  if (lookAgainAt !== null) {
    return {
      runAgainAt: new Date(lookAgainAt),
      ...(decideBy !== null && {decideBy: new Date(decideBy)}),
    };
  }
}
