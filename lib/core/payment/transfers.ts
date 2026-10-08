import 'server-only';

import type {Client} from '@/goovee/.generated/client';
import type {Tenant} from '@/tenant';
import {getAdapter} from './adapters/registry';
import type {CancelResult} from './adapters/types';
import {minorUnitsOf} from './domain/money';
import {
  TRANSFER_GATEWAYS,
  isWithdrawn,
  withdrawalRequest,
  type WithdrawalRequest,
} from './domain/transfers';
import {
  EVENT_TYPE,
  TASK_KIND,
  PAYMENT_SOURCE,
  PAYMENT_STATUS,
  SESSION_STATUS,
  type Gateway,
} from './domain/types';
import {triggerRegistration} from './register';
import {settlePayment} from './settle';
import {SUBJECT_MODEL, readSubject, subjectIdOf} from './domain/subject';

/**
 * A transfer on an invoice the payer's bank has not finished: a session at a
 * transfer gateway that has received less than it asks for. Read per session
 * rather than per payment, because a payment's status and gateway follow its
 * latest session: a payer who presses again under another method leaves the
 * earlier transfer open at the provider while the payment itself no longer
 * says so.
 */
export type OpenTransferSession = {
  sessionId: string;
  sessionRef: string;
  gateway: Gateway;
  startedOn: Date | null;
  paymentId: string;
  reference: string;
  payer: string | null;
  workspaceUrl: string;
  /** What the session asked its provider for, in minor units of its currency. */
  amount: number;
  /** What the session has received so far, in the same units. */
  received: number;
  currencyCode: string;
  currencyScale: number;
};

export async function findOpenTransferSessions({
  client,
  invoiceId,
}: {
  client: Client;
  invoiceId: string;
}): Promise<OpenTransferSession[]> {
  const sessions = await client.aOSPortalPaymentSession.find({
    where: {
      gateway: {in: [...TRANSFER_GATEWAYS]},
      status: SESSION_STATUS.awaiting,
      sessionRef: {ne: null},
      payment: {
        subjectModel: SUBJECT_MODEL.invoice,
        subjectId: invoiceId,
        source: PAYMENT_SOURCE.invoices,
      },
    },
    select: {
      sessionRef: true,
      gateway: true,
      amount: true,
      currencyCode: true,
      currencyScale: true,
      createdOn: true,
      payment: {
        reference: true,
        payer: true,
        amount: true,
        currencyCode: true,
        currencyScale: true,
        portalWorkspace: {url: true},
      },
    },
    orderBy: {id: 'DESC'},
  });
  if (!sessions.length) {
    return [];
  }

  /* A session's partial fundings are snapshots of one balance, so the
   * highest is what it holds, the same reading the payment's status is derived
   * from. A session that ended or was paid in full is no longer awaiting, so
   * nothing else is read. */
  const captures = await client.aOSPortalPaymentEvent.find({
    where: {
      session: {id: {in: sessions.map(session => session.id)}},
      type: EVENT_TYPE.partiallyCaptured,
    },
    select: {session: {id: true}, amount: true, currencyCode: true},
  });

  return sessions.flatMap((session): OpenTransferSession[] => {
    const {payment} = session;
    const amount = minorUnitsOf(session.amount);
    const {currencyCode, currencyScale} = session;
    const received = captures
      .filter(
        capture =>
          capture.session?.id === session.id &&
          (!capture.currencyCode || capture.currencyCode === currencyCode),
      )
      .reduce(
        (highest, capture) =>
          Math.max(highest, minorUnitsOf(capture.amount ?? '0')),
        0,
      );
    /* A session funded in part stays awaiting until it completes or ends. */
    if (received >= amount || !session.sessionRef) {
      return [];
    }
    return [
      {
        sessionId: session.id,
        sessionRef: session.sessionRef,
        gateway: session.gateway as Gateway,
        startedOn: session.createdOn ?? null,
        paymentId: payment.id,
        reference: payment.reference,
        payer: payment.payer,
        workspaceUrl: payment.portalWorkspace.url ?? '',
        amount,
        received,
        currencyCode,
        currencyScale,
      },
    ];
  });
}

/**
 * An open transfer that has received part of what it asks for. It stays open
 * at the provider for the rest until its window ends, and the invoice guard
 * never takes it back, so any other payment of the invoice would be paid twice
 * once the rest arrives. Only a Stripe bank transfer is ever funded in part.
 */
export function isPartlyFunded(
  session: Pick<OpenTransferSession, 'received'>,
): boolean {
  return session.received > 0;
}

/**
 * The transfer on the invoice that is funded in part, if any. While one is,
 * the invoice takes no other payment: the payer completes that transfer.
 */
export async function findPartlyFundedTransfer({
  client,
  invoiceId,
}: {
  client: Client;
  invoiceId: string;
}): Promise<OpenTransferSession | null> {
  const sessions = await findOpenTransferSessions({client, invoiceId});
  return sessions.find(isPartlyFunded) ?? null;
}

/**
 * What a session had received when it ended cancelled or expired, and so what
 * Stripe put back in the payer's cash balance: the highest of its partial
 * fundings, the ledger's own reading of one balance. Null when none had
 * arrived.
 */
export async function returnedToPayer(
  client: Client,
  sessionId: string,
): Promise<{amount: number; currencyCode: string} | null> {
  const fundings = await client.aOSPortalPaymentEvent.find({
    where: {session: {id: sessionId}, type: EVENT_TYPE.partiallyCaptured},
    select: {amount: true, currencyCode: true},
  });
  let returned: {amount: number; currencyCode: string} | null = null;
  for (const funding of fundings) {
    const amount = minorUnitsOf(funding.amount ?? '0');
    if (funding.currencyCode && amount > (returned?.amount ?? 0)) {
      returned = {amount, currencyCode: funding.currencyCode};
    }
  }
  return returned;
}

/**
 * What the invoice still needs, in minor units at `scale`: the ERP's
 * remaining amount, less money the ledger holds for the invoice that the ERP
 * has not recorded yet, each payment's up to its own amount, which is what its
 * registration books. A capture reaches the ERP only when the payment is
 * registered, and a transfer funded in part not until it completes. A payment
 * a person resolved in the ERP is booked there by hand, so it is not held,
 * unless its registration is still to run and will book it.
 *
 * Read in one statement, so it is one snapshot: read in two, a registration
 * committing in between would leave the money counted by neither half.
 *
 * Money in another currency is not counted, which errs towards more still
 * owed. A refund made at the provider is not seen here: until finance reverses
 * the invoice payment in the ERP, the ERP's remaining amount, and so this, reads
 * less owed than the invoice really is.
 */
export async function invoiceRemaining({
  client,
  invoiceId,
  currencyCode,
  scale,
}: {
  client: Client;
  invoiceId: string;
  currencyCode: string;
  scale: number;
}): Promise<{remaining: number} | {skipped: string}> {
  const rows: unknown = await client.$raw(
    `SELECT ROUND(invoice.amount_remaining * (10::numeric ^ $4::int))::bigint::text AS erp_remaining,
            currency.codeiso AS currency_code,
            COALESCE(SUM(CASE WHEN payment.registered_invoice_payment IS NULL
                                AND (payment.resolved_on IS NULL
                                     OR EXISTS (SELECT 1 FROM portal_portal_payment_task AS task
                                                 WHERE task.payment = payment.id
                                                   AND task.kind = $8))
                                AND payment.status IN ($5, $6)
                              THEN LEAST(payment.captured_amount, payment.amount)
                         END), 0)::text AS held
       FROM account_invoice AS invoice
       LEFT JOIN base_currency AS currency ON currency.id = invoice.currency
       LEFT JOIN portal_portal_payment AS payment
              ON payment.subject_model = $7
             AND payment.subject_id = invoice.id
             AND payment.source = $2
             AND payment.currency_code = $3
             AND payment.currency_scale = $4
      WHERE invoice.id = $1
      GROUP BY invoice.amount_remaining, currency.codeiso`,
    invoiceId,
    PAYMENT_SOURCE.invoices,
    currencyCode,
    scale,
    PAYMENT_STATUS.captured,
    PAYMENT_STATUS.partiallyCaptured,
    SUBJECT_MODEL.invoice,
    TASK_KIND.register,
  );
  const row: unknown = Array.isArray(rows) ? rows[0] : null;
  if (typeof row !== 'object' || row === null) {
    return {skipped: 'the invoice was not found'};
  }
  const {erp_remaining, currency_code, held} = row as Record<string, unknown>;
  if (currency_code !== currencyCode) {
    return {skipped: `the invoice is not in ${currencyCode}`};
  }
  /* Not knowing what is owed is not the same as owing nothing. */
  if (erp_remaining == null) {
    return {skipped: 'the invoice has no remaining amount'};
  }
  return {remaining: Number(erp_remaining) - Number(held ?? 0)};
}

export type WithdrawalReport = Record<CancelResult['outcome'], number>;

/**
 * The invoice guard: once money has landed on an invoice, withdraws the open
 * transfers it no longer needs, so money wired later cannot pay it twice.
 * Runs as its own task, after the capture's transaction, because it calls the
 * provider. Every outcome is recorded the way the provider's own event would
 * record it, so the event arriving later changes nothing.
 *
 * Which transfers go is decided on what each session asked for; the
 * provider's own figure is checked again at the moment of withdrawal, and has
 * the last word.
 */
export async function withdrawUnneededTransfers({
  tenant,
  paymentId,
}: {
  tenant: Tenant;
  paymentId: string;
}): Promise<WithdrawalReport> {
  const report: WithdrawalReport = {
    cancelled: 0,
    'already-ended': 0,
    funded: 0,
    kept: 0,
  };
  const {client} = tenant;
  const payment = await client.aOSPortalPayment.findOne({
    where: {id: paymentId},
    select: {
      subjectModel: true,
      subjectId: true,
      currencyCode: true,
      currencyScale: true,
    },
  });
  const invoiceId = payment
    ? subjectIdOf(
        readSubject(payment.subjectModel, payment.subjectId),
        SUBJECT_MODEL.invoice,
      )
    : null;
  if (!payment || !invoiceId) {
    return report;
  }

  const owed = await invoiceRemaining({
    client,
    invoiceId,
    currencyCode: payment.currencyCode,
    scale: payment.currencyScale,
  });
  if ('skipped' in owed) {
    console.warn(
      `Payment ${paymentId}: transfers on invoice ${invoiceId} left as they are: ${owed.skipped}`,
    );
    return report;
  }

  /* Only transfers that have received nothing, and only at gateways that can
   * withdraw one. */
  const sessions = (await findOpenTransferSessions({client, invoiceId})).filter(
    session =>
      !isPartlyFunded(session) &&
      session.currencyCode === payment.currencyCode &&
      session.currencyScale === payment.currencyScale &&
      Boolean(getAdapter(session.gateway).cancelAwaiting),
  );
  /* Each transfer is its own call: one the provider cannot answer for must not
   * keep the others open. The task fails afterwards if any did, so it runs
   * again, and what was withdrawn this time reads back as ended. */
  /* The session's own amount decides which transfers are put to the
   * provider; the provider's live figure is checked again before anything is
   * withdrawn. */
  const request = withdrawalRequest(owed.remaining);
  const toWithdraw = sessions.filter(session =>
    isWithdrawn(request, session.amount),
  );
  report.kept += sessions.length - toWithdraw.length;
  const results = await Promise.allSettled(
    toWithdraw.map(session => withdraw({tenant, session, request})),
  );
  const failures: unknown[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      report[result.value.outcome] += 1;
    } else {
      failures.push(result.reason);
    }
  }
  if (failures.length) {
    throw new AggregateError(
      failures,
      `${failures.length} of ${toWithdraw.length} transfers on invoice ${invoiceId} could not be checked`,
    );
  }
  return report;
}

/**
 * The payer's withdrawal of one of their invoice's transfers. The invoice is
 * the scope: the caller passes one the payer has already been allowed to see,
 * and the transfer is looked up among that invoice's open ones, so an id from
 * another invoice names nothing.
 */
export async function withdrawTransferForPayer({
  tenant,
  invoiceId,
  sessionId,
}: {
  tenant: Tenant;
  invoiceId: string;
  sessionId: string;
}): Promise<CancelResult['outcome'] | 'not-found'> {
  const session = (
    await findOpenTransferSessions({client: tenant.client, invoiceId})
  ).find(
    candidate =>
      candidate.sessionId === sessionId &&
      Boolean(getAdapter(candidate.gateway).cancelAwaiting),
  );
  if (!session) {
    return 'not-found';
  }
  /* A transfer that has received part of the money is not withdrawn: the
   * ledger says so before the provider is even asked. */
  if (session.received > 0) {
    return 'funded';
  }
  const result = await withdraw({
    tenant,
    session,
    request: {reason: 'requested_by_customer'},
  });
  return result.outcome;
}

async function withdraw({
  tenant,
  session,
  request,
}: {
  tenant: Tenant;
  session: OpenTransferSession;
  request: WithdrawalRequest;
}): Promise<CancelResult> {
  const adapter = getAdapter(session.gateway);
  if (!adapter.cancelAwaiting) {
    throw new Error(`Gateway ${session.gateway} cannot withdraw a transfer`);
  }
  const result = await adapter.cancelAwaiting(session.sessionRef, request, {
    tenantId: tenant.id,
    config: tenant.config,
  });
  /* Recorded whatever the outcome: a withdrawal as the cancellation the
   * provider will also report, money that arrived first as the capture it
   * is. A capture recorded here goes to the ERP like any other. */
  const outcome = await settlePayment({signal: result.signal, tenant});
  if (outcome.outcome === 'settled' && outcome.registrationQueued) {
    await triggerRegistration({tenant, reference: outcome.reference});
  }
  return result;
}
