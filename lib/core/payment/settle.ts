import 'server-only';

import type {Client} from '@/goovee/.generated/client';
import type {Tenant} from '@/tenant';
import {fromMinorUnits, minorUnitsOf, scaleOfCurrency} from './domain/money';
import {eventKeyOf, type GatewaySignal} from './domain/signal';
import {
  deriveStatus,
  overCapturedBy,
  sessionStatusFor,
  type LedgerEntry,
} from './domain/status';
import {
  SUBJECT_MODEL,
  readSubject,
  subjectColumns,
  type Subject,
} from './domain/subject';
import {
  FULFILMENT_STATUS,
  EVENT_TYPE,
  TASK_KIND,
  RECEIVED_VIA,
  PAYMENT_SOURCE,
  PAYMENT_STATUS,
  SESSION_STATUS,
  type EventType,
  type PaymentStatus,
  type SessionStatus,
} from './domain/types';
import {dropReconcileIfSettled} from './reconcile-schedule';
import {resolvePayment} from './resolve';
import {getSourceHandler} from './sources/registry';
import {readSnapshot} from './intent';

/**
 * How long a registration task may stay open before the payment is listed under
 * Payments to resolve.
 */
const REGISTRATION_GRACE_SECONDS = 5 * 60;

/* How much of a delivery error is kept as the undeliverable reason. */
const FULFILMENT_ISSUE_MAX_LENGTH = 2000;

/* SQLSTATEs a second attempt can get past: deadlock, serialization failure,
 * lock not available, statement cancelled by a timeout. */
const RETRYABLE_SQLSTATES = new Set(['40P01', '40001', '55P03', '57014']);

/* A field of the driver's error, on the error itself or on the driver error
 * the query layer wraps: the SQLSTATE is `code`, Postgres's explanation of a
 * violated key is `detail`. */
function driverFieldOf(error: unknown, field: 'code' | 'detail'): string[] {
  const fieldOf = (value: unknown): unknown =>
    typeof value === 'object' && value !== null && field in value
      ? (value as Record<string, unknown>)[field]
      : null;
  const driverError =
    typeof error === 'object' && error !== null && 'driverError' in error
      ? (error as {driverError: unknown}).driverError
      : null;
  return [fieldOf(error), fieldOf(driverError)].filter(
    (value): value is string => typeof value === 'string',
  );
}

function isRetryableDatabaseError(error: unknown): boolean {
  return driverFieldOf(error, 'code').some(code =>
    RETRYABLE_SQLSTATES.has(code),
  );
}

/* A transfer left open can be paid while the check waits, so the check is
 * listed under Pending tasks as overdue sooner than a registration would be. */
const TRANSFER_CHECK_GRACE_SECONDS = 2 * 60;

/* A confirmation still unsent after this is a payer who paid and heard
 * nothing, listed under Pending tasks as overdue: long enough for a retry or
 * two, short enough to be noticed. */
const NOTIFY_GRACE_SECONDS = 15 * 60;

export type SettleOutcome =
  | {
      outcome: 'settled';
      paymentId: string;
      reference: string;
      status: PaymentStatus;
      /** A registration task was written; the caller may ask AOS to run it now. */
      registrationQueued: boolean;
      /** A task goovee runs itself was written; the caller may run it now. */
      gooveeTasksQueued: boolean;
    }
  /**
   * The financial event was already in the ledger. Nothing changed.
   * `recordedOn` is the reference of the payment whose ledger holds it: this
   * one, unless the provider's id named an event of another payment.
   */
  | {outcome: 'duplicate'; reference: string; recordedOn: string}
  /** The provider has not decided yet. Nothing recorded. */
  | {outcome: 'pending'; reference: string | null}
  /** Acknowledged and dropped: another tenant's, not ours, or naming nothing. */
  | {outcome: 'rejected'; reason: 'other-tenant' | 'not-ours' | 'not-found'};

type LockedPayment = {
  id: string;
  version: number;
  reference: string;
  source: string;
  amount: number;
  capturedAmount: number;
  currencyCode: string;
  currencyScale: number;
  status: PaymentStatus;
  fulfilmentStatus: string | null;
  lastError: string | null;
  payer: string | null;
  workspaceId: string;
  paymentModeId: string | null;
  capturedOn: Date | null;
  subject: Subject | null;
};

/**
 * T2. Records one provider event and everything that follows from it, in one
 * transaction: the row lock, the keyed insert, the status recompute, the
 * source's delivery and the registration task. Takes no request, session, user or
 * cart, so it cannot behave differently for the leg that called it.
 *
 * The insert is the first write. Two legs observing the same capture both
 * reach it; the second blocks on the first's uncommitted row, then sees it
 * committed, gets no row back and stops. Delivery runs exactly once.
 */
export async function settlePayment({
  signal,
  tenant,
}: {
  signal: GatewaySignal;
  tenant: Tenant;
}): Promise<SettleOutcome> {
  const {client} = tenant;

  const resolved = await resolvePayment({
    resolution: signal.resolution,
    gateway: signal.gateway,
    tenantId: tenant.id,
    client,
  });

  if (resolved.kind === 'other-tenant' || resolved.kind === 'not-ours') {
    return {outcome: 'rejected', reason: resolved.kind};
  }

  if (resolved.kind === 'not-found') {
    return {outcome: 'rejected', reason: 'not-found'};
  }

  if (signal.type === 'pending' || !signal.eventId) {
    const payment = await client.aOSPortalPayment.findOne({
      where: {id: resolved.paymentId},
      select: {reference: true},
    });
    return {outcome: 'pending', reference: payment?.reference ?? null};
  }

  const eventType = signal.type;
  const eventKey = eventKeyOf(eventType, signal.eventId);

  return client.$transaction(async txClient => {
    const payment = await lockPayment(txClient, resolved.paymentId);

    const session = await findSession(txClient, payment.id, signal);

    const inserted = await txClient.$raw(
      `INSERT INTO portal_portal_payment_event
         (id, version, created_on, payment, session, gateway, event_key, type, amount,
          currency_code, currency_scale, received_via, received_on, provider_ref, reason, payload)
       VALUES (nextval('portal_portal_payment_event_seq'), 0, now(), $1, $2, $3, $4, $5, $6,
               $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (gateway, event_key) DO NOTHING
       RETURNING id`,
      payment.id,
      session?.id ?? null,
      signal.gateway,
      eventKey,
      eventType,
      signal.amount,
      signal.currencyCode,
      signal.currencyCode
        ? scaleOfCurrency(signal.currencyCode)
        : payment.currencyScale,
      signal.receivedVia,
      signal.receivedOn,
      signal.providerRef,
      signal.reason,
      JSON.stringify(signal.payload ?? null),
    );

    if (!Array.isArray(inserted) || inserted.length === 0) {
      /* The webhook's word on a capture the browser recorded first. Nothing
       * about the money changes, but the event is now confirmed by the
       * provider's own transport, and leaves the ERP's Missed webhooks
       * list. */
      if (signal.receivedVia === RECEIVED_VIA.webhook) {
        await txClient.$raw(
          `UPDATE portal_portal_payment_event
             SET confirmed_on = now(), updated_on = now()
           WHERE gateway = $1 AND event_key = $2 AND confirmed_on IS NULL`,
          signal.gateway,
          eventKey,
        );
      }
      const holder: unknown = await txClient.$raw(
        `SELECT payment.reference
           FROM portal_portal_payment_event event
           JOIN portal_portal_payment payment ON payment.id = event.payment
          WHERE event.gateway = $1 AND event.event_key = $2`,
        signal.gateway,
        eventKey,
      );
      const row: unknown = Array.isArray(holder) ? holder[0] : null;
      const recordedOn =
        typeof row === 'object' && row !== null && 'reference' in row
          ? String((row as {reference: unknown}).reference)
          : payment.reference;
      return {outcome: 'duplicate', reference: payment.reference, recordedOn};
    }

    if (session) {
      await updateSession(txClient, session, signal, eventType);
    }

    /* An event in another currency, or converted at another scale than the
     * payment's, is recorded but never summed: minor units only add up when
     * they are minor units of the same thing. */
    const currencyMismatch =
      signal.currencyCode != null &&
      !isCountable(
        signal.currencyCode,
        payment.currencyCode,
        payment.currencyScale,
      );

    const ledger = await loadLedger(
      txClient,
      payment.id,
      payment.currencyCode,
      payment.currencyScale,
    );
    const latestSessionStatus = await latestSession(txClient, payment.id);
    const derived = deriveStatus({
      amount: payment.amount,
      ledger,
      latestSessionStatus,
    });

    const newlyCaptured =
      derived.status === PAYMENT_STATUS.captured &&
      payment.status !== PAYMENT_STATUS.captured;
    /* Delivery happens once, on the capture that first completes the payment. */
    const firstCapture =
      newlyCaptured &&
      (payment.fulfilmentStatus === FULFILMENT_STATUS.pending ||
        payment.fulfilmentStatus === null);

    const isCapture =
      eventType === EVENT_TYPE.captured ||
      eventType === EVENT_TYPE.partiallyCaptured;

    let fulfilmentStatus = payment.fulfilmentStatus;
    let fulfilmentIssue: string | null = null;
    let registrationQueued = false;
    let gooveeTasksQueued = false;

    if (firstCapture) {
      /* A delivery that throws must not take the capture with it: Postgres
       * aborts the whole transaction on a failed statement, so the delivery and
       * what depends on it run under a savepoint that is rolled back on error,
       * and the payment is left undeliverable for a person, money kept. */
      await txClient.$raw('SAVEPOINT deliver');
      try {
        const handler = getSourceHandler(
          payment.source as Parameters<typeof getSourceHandler>[0],
        );
        const snapshot = await readSnapshot(txClient, payment.id);
        const delivery = await handler.deliver({
          payment: {
            id: payment.id,
            reference: payment.reference,
            money: {
              amount: payment.amount,
              currencyCode: payment.currencyCode,
              currencyScale: payment.currencyScale,
            },
            payer: payment.payer,
            workspaceId: payment.workspaceId,
            paymentModeId: payment.paymentModeId,
          },
          snapshot,
          txClient,
          tenant,
        });

        if (delivery.delivered) {
          fulfilmentStatus = FULFILMENT_STATUS.delivered;
          /* Inside the savepoint: a subject another payment already holds
           * breaks its unique key here, and that is rolled back with the
           * delivery, the capture kept. */
          if (delivery.subject && !payment.subject) {
            await writeSubject(txClient, payment.id, delivery.subject);
          }
          await upsertTask(
            txClient,
            payment.id,
            TASK_KIND.register,
            REGISTRATION_GRACE_SECONDS,
          );
          registrationQueued = true;
          /* Written with the capture, so the confirmation survives whatever
           * becomes of this request. An undeliverable payment is a human's to
           * decide and is not confirmed. */
          if (handler.notify) {
            await upsertTask(
              txClient,
              payment.id,
              TASK_KIND.notify,
              NOTIFY_GRACE_SECONDS,
            );
            gooveeTasksQueued = true;
          }
        } else {
          fulfilmentStatus = FULFILMENT_STATUS.undeliverable;
          fulfilmentIssue = delivery.reason.slice(
            0,
            FULFILMENT_ISSUE_MAX_LENGTH,
          );
        }
        await txClient.$raw('RELEASE SAVEPOINT deliver');
      } catch (error) {
        await txClient.$raw('ROLLBACK TO SAVEPOINT deliver');
        /* A deadlock or a timeout is the database's, not the purchase's: the
         * whole settle is undone and the provider or the reconcile runs it
         * again, as before there was a savepoint. */
        if (isRetryableDatabaseError(error)) {
          throw error;
        }
        fulfilmentStatus = FULFILMENT_STATUS.undeliverable;
        /* Postgres's detail names the key and value a violated unique key
         * refused, such as a subject another payment is already for. */
        const [detail] = driverFieldOf(error, 'detail');
        fulfilmentIssue = `Delivery failed: ${
          error instanceof Error ? error.message : String(error)
        }${detail ? ` (${detail})` : ''}`.slice(0, FULFILMENT_ISSUE_MAX_LENGTH);
        registrationQueued = false;
        gooveeTasksQueued = false;
        console.error(
          `[PAYMENT][DELIVER] ${payment.reference} delivery failed; the capture is kept and the payment is undeliverable`,
          error,
        );
      }
    }

    /* Money on an invoice may leave another transfer on it unneeded. Checking
     * means asking the provider, which cannot happen here, so the check is a
     * task written with the capture and run once this commits. */
    if (
      isCapture &&
      !currencyMismatch &&
      payment.source === PAYMENT_SOURCE.invoices &&
      payment.subject?.model === SUBJECT_MODEL.invoice
    ) {
      await upsertTask(
        txClient,
        payment.id,
        TASK_KIND.cancelTransfers,
        TRANSFER_CHECK_GRACE_SECONDS,
      );
      gooveeTasksQueued = true;
    }

    /* More captured than the payment was for: two of its sessions both took
     * the money. Said here, when the event is recorded, because a capture that
     * lands after the payment was registered reaches nothing else — the
     * registration has already run and will not run again. The excess is given
     * back at the provider, and the decision stays until a person resolves the
     * payment in the ERP. Only a capture that moved the total raises it, so an
     * event after that, a session's late expiry or a funding it had already
     * counted, does not bring back what was resolved. */
    const excess = overCapturedBy(derived.capturedAmount, payment.amount);
    const overCaptureMessage =
      isCapture && excess > 0 && derived.capturedAmount > payment.capturedAmount
        ? `Captured ${fromMinorUnits(derived.capturedAmount, payment.currencyScale)} ${payment.currencyCode}, ${fromMinorUnits(excess, payment.currencyScale)} more than the ${fromMinorUnits(payment.amount, payment.currencyScale)} the payment was for; refund the excess at the provider, then resolve the payment`
        : null;
    if (overCaptureMessage) {
      await parkForDecision(
        txClient,
        payment.id,
        TASK_KIND.overCaptured,
        overCaptureMessage,
      );
    }

    await txClient.aOSPortalPayment.update({
      data: {
        id: payment.id,
        version: payment.version,
        status: derived.status,
        capturedAmount: String(derived.capturedAmount),
        ...(newlyCaptured &&
          !payment.capturedOn && {capturedOn: signal.receivedOn}),
        ...(isCapture &&
          signal.providerRef && {providerRef: signal.providerRef}),
        ...(fulfilmentStatus && {fulfilmentStatus}),
        ...(fulfilmentIssue && {fulfilmentIssue}),
        ...(currencyMismatch && {
          lastError: `Provider reported ${signal.currencyCode} for a payment in ${payment.currencyCode} at scale ${payment.currencyScale}; the event is recorded but not counted`,
        }),
        ...(overCaptureMessage && {lastError: overCaptureMessage}),
      },
      select: {id: true},
    });

    /* The backstop goes once the provider has told us the end of every
     * session; a payment funded in part keeps it, since the rest may come. */
    await dropReconcileIfSettled(txClient, payment.id, derived.status);

    return {
      outcome: 'settled',
      paymentId: payment.id,
      reference: payment.reference,
      status: derived.status,
      registrationQueued,
      gooveeTasksQueued,
    };
  });
}

/**
 * Closes sessions no provider will ever tell us about as "no answer": a
 * provider that cannot be asked and sent nothing long past the time it would
 * have, a start whose handoff never reached the payer, an answer that names
 * no payment of ours, or one still open long past its deadline. Each may
 * carry why, kept on the session for finance to follow up. Writes no event —
 * the provider said nothing — only the sessions' outcome, the payment's
 * status as it then derives, and the end of its reconcile row.
 *
 * Not an ending the provider's word must respect: a notification that comes
 * after this settles the session like any other (updateSession treats "no
 * answer" as still open), with delivery, registration and confirmation.
 */
export async function closeUnanswered({
  tenant,
  paymentId,
  sessions,
}: {
  tenant: Tenant;
  paymentId: string;
  /** The sessions to close, each with why when there is more to say than that nothing came. */
  sessions: {id: string; reason: string | null}[];
}): Promise<void> {
  if (!sessions.length) {
    return;
  }
  await tenant.client.$transaction(async txClient => {
    const payment = await lockPayment(txClient, paymentId);
    /* Only sessions still waiting: one the provider answered since the task
     * read it keeps that answer. The reason goes before what the session
     * already said. */
    await txClient.$raw(
      `UPDATE portal_portal_payment_session AS session
          SET status = $3,
              failure_reason = COALESCE(
                closing.reason || COALESCE(' (' || session.failure_reason || ')', ''),
                session.failure_reason),
              version = session.version + 1, updated_on = now()
         FROM unnest($2::bigint[], $5::text[]) AS closing(id, reason)
        WHERE session.payment = $1 AND session.id = closing.id
          AND session.status = ANY($4::text[])`,
      paymentId,
      sessions.map(session => session.id),
      SESSION_STATUS.unconfirmed,
      [SESSION_STATUS.initiated, SESSION_STATUS.awaiting],
      sessions.map(session => session.reason),
    );
    const derived = deriveStatus({
      amount: payment.amount,
      ledger: await loadLedger(
        txClient,
        payment.id,
        payment.currencyCode,
        payment.currencyScale,
      ),
      latestSessionStatus: await latestSession(txClient, payment.id),
    });
    if (derived.status !== payment.status) {
      await txClient.aOSPortalPayment.update({
        data: {
          id: payment.id,
          version: payment.version,
          status: derived.status,
        },
        select: {id: true},
      });
    }
    await dropReconcileIfSettled(txClient, payment.id, derived.status);
  });
}

/*
 * The row lock serialises settles on one payment. Without it two different
 * events, a partial funding and its remainder, could both sum the ledger under
 * READ COMMITTED without seeing each other. The columns are read through the
 * client afterwards, on the same connection, so the version is current.
 */
async function lockPayment(
  txClient: Client,
  paymentId: string,
): Promise<LockedPayment> {
  await txClient.$raw(
    'SELECT id FROM portal_portal_payment WHERE id = $1 FOR UPDATE',
    paymentId,
  );

  const payment = await txClient.aOSPortalPayment.findOne({
    where: {id: paymentId},
    select: {
      reference: true,
      source: true,
      amount: true,
      capturedAmount: true,
      currencyCode: true,
      currencyScale: true,
      status: true,
      fulfilmentStatus: true,
      lastError: true,
      payer: true,
      capturedOn: true,
      subjectModel: true,
      subjectId: true,
      portalWorkspace: {id: true},
      paymentMode: {id: true},
    },
  });
  if (!payment) {
    throw new Error(`Payment ${paymentId} vanished under its lock`);
  }

  return {
    id: payment.id,
    version: payment.version,
    reference: payment.reference,
    source: payment.source,
    amount: minorUnitsOf(payment.amount),
    capturedAmount: minorUnitsOf(payment.capturedAmount),
    currencyCode: payment.currencyCode,
    currencyScale: payment.currencyScale,
    status: payment.status as PaymentStatus,
    fulfilmentStatus: payment.fulfilmentStatus,
    lastError: payment.lastError,
    payer: payment.payer,
    workspaceId: payment.portalWorkspace.id,
    paymentModeId: payment.paymentMode?.id ?? null,
    capturedOn: payment.capturedOn,
    subject: readSubject(payment.subjectModel, payment.subjectId),
  };
}

type SessionRow = {
  id: string;
  version: number;
  sessionRef: string | null;
  status: string;
};

/* The session the event belongs to: the one the signal names, else the latest
 * one opened at this gateway. */
async function findSession(
  txClient: Client,
  paymentId: string,
  signal: GatewaySignal,
): Promise<SessionRow | null> {
  const select = {sessionRef: true, status: true} as const;
  if (signal.sessionRef) {
    const named = await txClient.aOSPortalPaymentSession.findOne({
      where: {
        payment: {id: paymentId},
        gateway: signal.gateway,
        sessionRef: signal.sessionRef,
      },
      select,
    });
    if (named) {
      return named;
    }
  }
  const sessions = await txClient.aOSPortalPaymentSession.find({
    where: {payment: {id: paymentId}, gateway: signal.gateway},
    select,
    orderBy: {id: 'DESC'},
    take: 1,
  });
  return sessions[0] ?? null;
}

async function updateSession(
  txClient: Client,
  session: SessionRow,
  signal: GatewaySignal,
  eventType: EventType,
): Promise<void> {
  /* A session keeps its first outcome. The buyer's cancel and Stripe's later
   * "expired" for the same session are one ending, and a capture is never
   * undone by a session notice that arrives after it. */
  /* Our own "no answer" is no outcome of the provider's: its word, however
   * late, replaces it. */
  const open =
    session.status === SESSION_STATUS.initiated ||
    session.status === SESSION_STATUS.awaiting ||
    session.status === SESSION_STATUS.unconfirmed;
  const status = open ? sessionStatusFor(eventType) : null;
  const sessionRef =
    signal.sessionRef && !session.sessionRef ? signal.sessionRef : undefined;
  if (!status && !sessionRef) {
    return;
  }
  await txClient.aOSPortalPaymentSession.update({
    data: {
      id: session.id,
      version: session.version,
      ...(status && {status}),
      ...(sessionRef && {sessionRef}),
      ...(eventType === EVENT_TYPE.refused &&
        signal.reason && {failureReason: signal.reason}),
    },
    select: {id: true},
  });
}

/* An event without a currency was reported in the payment's own currency by
 * a provider that echoes none (the Verifone family). One with a currency
 * counts only when it is the payment's and the provider edge converted it at
 * the scale the payment was frozen at. */
function isCountable(
  eventCurrency: string | null,
  paymentCurrency: string,
  paymentScale: number,
): boolean {
  if (!eventCurrency) {
    return true;
  }
  return (
    eventCurrency.toUpperCase() === paymentCurrency.toUpperCase() &&
    scaleOfCurrency(eventCurrency) === paymentScale
  );
}

async function loadLedger(
  txClient: Client,
  paymentId: string,
  currencyCode: string,
  currencyScale: number,
): Promise<LedgerEntry[]> {
  const events = await txClient.aOSPortalPaymentEvent.find({
    where: {payment: {id: paymentId}},
    select: {
      type: true,
      amount: true,
      currencyCode: true,
      eventKey: true,
      session: {id: true},
    },
  });
  return events.map(event => ({
    type: event.type as EventType,
    amount: minorUnitsOf(event.amount),
    countable: isCountable(event.currencyCode, currencyCode, currencyScale),
    sessionId: event.session?.id ?? null,
    eventKey: event.eventKey,
  }));
}

async function latestSession(
  txClient: Client,
  paymentId: string,
): Promise<SessionStatus | null> {
  const sessions = await txClient.aOSPortalPaymentSession.find({
    where: {payment: {id: paymentId}},
    select: {status: true},
    orderBy: {id: 'DESC'},
    take: 1,
  });
  return (sessions[0]?.status as SessionStatus | undefined) ?? null;
}

/* Written without moving the version on: the payment's own update later in
 * the same transaction does, against the version read under the lock. */
async function writeSubject(
  txClient: Client,
  paymentId: string,
  subject: Subject,
): Promise<void> {
  const {subjectModel, subjectId, exclusiveSubjectId} = subjectColumns(subject);
  await txClient.$raw(
    `UPDATE portal_portal_payment
        SET subject_model = $2, subject_id = $3, exclusive_subject_id = $4,
            updated_on = now()
      WHERE id = $1`,
    paymentId,
    subjectModel,
    subjectId,
    exclusiveSubjectId,
  );
}

/* One row per kind per payment. A second capture on a payment whose task is
 * still open makes it due again rather than queueing a second one, and moves
 * its version on, so a run that claimed the task before cannot then finish it:
 * the fresh request must run. */
async function upsertTask(
  txClient: Client,
  paymentId: string,
  kind: string,
  graceSeconds: number,
): Promise<void> {
  await txClient.$raw(
    `INSERT INTO portal_portal_payment_task
       (id, version, created_on, payment, kind, next_retry_on, overdue_on, attempts)
     VALUES (nextval('portal_portal_payment_task_seq'), 0, now(), $1, $2, now(),
             now() + make_interval(secs => $3), 0)
     ON CONFLICT (payment, kind) DO UPDATE
       SET next_retry_on = now(), overdue_on = EXCLUDED.overdue_on, attempts = 0,
           classification = NULL, last_error = NULL, updated_on = now(),
           version = COALESCE(portal_portal_payment_task.version, 0) + 1`,
    paymentId,
    kind,
    graceSeconds,
  );
}

/* A task no one runs, written parked for a decision and due for attention at
 * once, so the payment is listed as needing a human until one clears it. */
async function parkForDecision(
  txClient: Client,
  paymentId: string,
  kind: string,
  reason: string,
): Promise<void> {
  await txClient.$raw(
    `INSERT INTO portal_portal_payment_task
       (id, version, created_on, payment, kind, next_retry_on, overdue_on, attempts,
        classification, last_error)
     VALUES (nextval('portal_portal_payment_task_seq'), 0, now(), $1, $2, now(), now(), 0,
             'needs_decision', $3)
     ON CONFLICT (payment, kind) DO UPDATE
       SET overdue_on = now(), classification = 'needs_decision', last_error = EXCLUDED.last_error,
           updated_on = now(), version = COALESCE(portal_portal_payment_task.version, 0) + 1`,
    paymentId,
    kind,
    reason,
  );
}

export {SESSION_STATUS};
