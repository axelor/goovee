import 'server-only';

import {after} from 'next/server';
import type {ReadonlyRequestCookies} from 'next/dist/server/web/spec-extension/adapters/request-cookies';

import type {Tenant} from '@/tenant';
import {canViewPayment} from '@/payment/access';
import {getAdapter} from '@/payment/adapters/registry';
import type {AwaitingInstructions} from '@/payment/adapters/types';
import {GATEWAY, type Gateway} from '@/payment/domain/types';
import {runPaymentTasks} from '@/payment/tasks';
import {triggerRegistration} from '@/payment/register';
import {settlePayment} from '@/payment/settle';
import {
  findOpenTransferSessions,
  isPartlyFunded,
  type OpenTransferSession,
} from '@/payment/transfers';
import {paymentPageUrl} from '@/payment/urls';

/** A transfer started on the invoice that the payer's bank has not finished. */
export type PendingTransfer = {
  /** Names this transfer to a withdrawal; only ever resolved under the invoice it was listed on. */
  id: string;
  gateway: Gateway;
  /** Minor units of the payment's currency. */
  amount: number;
  /** Minor units still expected: the whole amount, or what a partial funding left. */
  remaining: number;
  currencyCode: string;
  currencyScale: number;
  startedOn: string | null;
  /** What to wire and to where, as the provider states it. Only some gateways can say. */
  instructions: AwaitingInstructions | null;
  /** The payment's own page, only when this viewer is one it will open for. */
  href: string | null;
  /** The payer may withdraw it: the gateway can, and nothing has arrived for it yet. */
  cancelable: boolean;
  /** Part of it has arrived; until the rest does, the invoice takes no other payment. */
  partlyFunded: boolean;
};

/**
 * The transfers on an invoice still waiting on the payer's bank, read from the
 * payment ledger. The invoice is the scope: callers pass one the viewer has
 * already been allowed to see, through their session or the invoice's token.
 *
 * A HUB PISP link lives half an hour and nothing else asks what became of one,
 * so each is asked here, and what the bank attests is recorded like any other
 * event before the list is drawn: an expired or finished link leaves it. A
 * link the bank cannot be asked about stays listed as the ledger has it.
 *
 * The payment page opens only for the browser that came back from the
 * provider, or the signed-in payer, and a transfer can take days. So each entry
 * carries what the payer needs to finish it, and the link is offered only
 * where it will open.
 */
export async function findPendingTransfers({
  tenant,
  invoiceId,
  cookies,
  viewerEmail,
}: {
  tenant: Tenant;
  invoiceId: string;
  cookies: ReadonlyRequestCookies;
  viewerEmail: string | null;
}): Promise<PendingTransfer[]> {
  const sessions = await findOpenTransferSessions({
    client: tenant.client,
    invoiceId,
  });

  /* Settled rather than awaited together: every answer comes from a
   * provider, and one it cannot give must not take the invoice down with it. */
  const checked = await Promise.allSettled(
    sessions.map(session => stillOpen(tenant, session)),
  );
  const open = sessions.filter((session, index) => {
    const result = checked[index];
    if (result.status === 'rejected') {
      console.warn(
        `Payment ${session.reference}: the provider could not be asked about the transfer`,
        result.reason,
      );
      return true;
    }
    return result.value;
  });

  const instructions = await Promise.allSettled(
    open.map(session => describe(tenant, session)),
  );

  return open.map((session, index) => {
    const described = instructions[index];
    if (described.status === 'rejected') {
      console.warn(
        `Payment ${session.reference}: transfer instructions could not be read`,
        described.reason,
      );
    }
    const adapter = getAdapter(session.gateway);
    const details = described.status === 'fulfilled' ? described.value : null;
    /* What is still expected is the lower of the provider's figure and the
     * ledger's: the provider knows of a cash balance applied at confirmation,
     * the ledger of a funding recorded since the provider's figure was read. */
    const ledgerRemaining = Math.max(session.amount - session.received, 0);
    const providerRemaining = providerMinorUnits(
      details?.amountRemaining,
      session,
    );
    const remaining =
      providerRemaining === null
        ? ledgerRemaining
        : Math.min(providerRemaining, ledgerRemaining);
    return {
      id: session.sessionId,
      gateway: session.gateway,
      amount: session.amount,
      remaining,
      currencyCode: session.currencyCode,
      currencyScale: session.currencyScale,
      startedOn: session.startedOn?.toISOString() ?? null,
      instructions: details,
      href: canViewPayment({
        cookies,
        tenant,
        reference: session.reference,
        payer: session.payer,
        userEmail: viewerEmail,
      })
        ? paymentPageUrl(tenant.id, session.workspaceUrl, session.reference)
        : null,
      cancelable: Boolean(adapter.cancelAwaiting) && !isPartlyFunded(session),
      partlyFunded: isPartlyFunded(session),
    };
  });
}

/* Only HUB PISP is asked: its links expire within the half hour, while a
 * Stripe transfer stays open for days and its webhook is the one that says. */
async function stillOpen(
  tenant: Tenant,
  session: OpenTransferSession,
): Promise<boolean> {
  if (session.gateway !== GATEWAY.hubpisp) {
    return true;
  }
  const signal = await getAdapter(session.gateway).fetchStatus(
    session.sessionRef,
    {tenantId: tenant.id, config: tenant.config},
  );
  if (signal.type === 'pending') {
    return true;
  }
  const outcome = await settlePayment({signal, tenant});
  if (outcome.outcome === 'settled') {
    const {paymentId, reference} = outcome;
    if (outcome.registrationQueued) {
      after(() => triggerRegistration({tenant, reference}));
    }
    if (outcome.gooveeTasksQueued) {
      after(() => runPaymentTasks({tenant, paymentId}));
    }
  }
  /* Captured, expired, refused or cancelled: the link is finished either way. */
  return false;
}

/* A decimal amount the provider stated, in the session's minor units, or null
 * when it stated none or stated one this payment cannot hold. */
function providerMinorUnits(
  value: string | undefined,
  session: OpenTransferSession,
): number | null {
  if (!value) {
    return null;
  }
  const minor = Math.round(Number(value) * 10 ** session.currencyScale);
  return Number.isSafeInteger(minor) && minor >= 0 ? minor : null;
}

async function describe(
  tenant: Tenant,
  session: OpenTransferSession,
): Promise<AwaitingInstructions | null> {
  const adapter = getAdapter(session.gateway);
  if (!adapter.describeAwaiting) {
    return null;
  }
  return adapter.describeAwaiting(session.sessionRef, {
    tenantId: tenant.id,
    config: tenant.config,
  });
}
