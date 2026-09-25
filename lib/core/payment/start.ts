import 'server-only';

import {randomUUID} from 'node:crypto';

import type {Client} from '@/goovee/.generated/client';
import {tenantURLs} from '@/url/scope';
import {getPaymentModeId, isPaymentOptionAvailable} from '@/utils/payment';
import type {Tenant} from '@/tenant';
import {t} from '@/locale/server';
import type {ActionResponse} from '@/types/action';
import {getAdapter, paymentOptionFor} from './adapters/registry';
import type {HubPispOption} from './adapters/hubpisp';
import {hubPispOptions} from './offer';
import type {Handoff} from './adapters/types';
import {scaleOfCurrency} from './domain/money';
import {purchaseKey} from './domain/purchase';
import {mintReference} from './domain/reference';
import {canRetry} from './domain/status';
import {
  FULFILMENT_STATUS,
  GATEWAY,
  PAYMENT_STATUS,
  SESSION_STATUS,
  type Gateway,
  type PaymentSource,
  type PaymentStatus,
} from './domain/types';
import {writeSnapshot} from './intent';
import {
  reconcileSchedule,
  rescheduleFromSessions,
  scheduleReconcile,
} from './reconcile-schedule';
import {getSourceHandler} from './sources/registry';
import type {PreparedIntent} from './sources/types';
import {paymentPageUrl} from './urls';
import {subjectColumns} from './domain/subject';

export type StartResult = {
  reference: string;
  /** What the browser does next. `page` sends it straight to the result page: the payment is already captured. */
  handoff: Handoff | {kind: 'page'; url: string};
};

/**
 * T1. Prices the intent on the server, writes the payment and a session with a
 * fresh idempotency key, commits, then calls the provider, then records the
 * provider's handle. A provider call that fails leaves the payment where the
 * reconciler can find it; no session can exist at a provider without a row
 * here naming it.
 *
 * The checkout token is minted when the checkout renders. A second press with
 * the same token and the same priced purchase finds the same payment: a
 * captured one is shown, an open one gets a new session at the chosen
 * gateway. A press that prices to anything else is a new payment.
 */
export async function startPayment({
  tenant,
  gateway,
  source,
  checkoutToken,
  intent,
  option,
}: {
  tenant: Tenant;
  gateway: Gateway;
  source: PaymentSource;
  checkoutToken: string;
  intent: unknown;
  /** A variant of the gateway the buyer chose, where the gateway offers any. */
  option?: HubPispOption;
}): ActionResponse<StartResult> {
  const handler = getSourceHandler(source);
  /* Checked before anything is priced or written: the offer is only what the
   * page rendered, and a start can name any gateway. */
  if (!handler.gateways.includes(gateway)) {
    return {
      error: true,
      message: await t('This payment method is not available'),
    };
  }
  const parsedIntent = handler.intentSchema.safeParse(intent);
  if (!parsedIntent.success) {
    return {error: true, message: await t('Invalid payment request')};
  }

  const prepared = await handler.prepare({intent: parsedIntent.data, tenant});
  if (prepared.error) {
    return prepared;
  }
  const adapter = getAdapter(gateway);
  const offered =
    isPaymentOptionAvailable(
      prepared.data.paymentOptions,
      paymentOptionFor(gateway),
    ) && adapter.isConfigured(tenant.config);
  if (!offered) {
    return {
      error: true,
      message: await t('This payment method is not available'),
    };
  }
  /* For a source with no fallback mode, a method with no ERP payment mode
   * would take the money and park every registration for a decision; better
   * refused before anything is charged. */
  if (
    handler.requiresPaymentMode &&
    !getPaymentModeId(prepared.data.paymentOptions, paymentOptionFor(gateway))
  ) {
    console.warn(
      `Payment method ${gateway} offered without a payment mode; refusing to start`,
    );
    return {
      error: true,
      message: await t('This payment method is not available'),
    };
  }
  /* The transfer type is one of those the workspace accepts on its HUB PISP
   * method, as the buttons offered; a start can name any. */
  if (
    gateway === GATEWAY.hubpisp &&
    !hubPispOptions(prepared.data.paymentOptions).includes(option ?? 'standard')
  ) {
    return {
      error: true,
      message: await t('This payment method is not available'),
    };
  }
  if (prepared.data.money.amount <= 0) {
    return {
      error: true,
      message: await t('The amount must be greater than zero.'),
    };
  }
  /* Every provider takes and reports an amount at the currency's own scale,
   * and the ledger counts an event only at the payment's: where the ERP's
   * scale for the currency is another, a minor-unit provider would be told a
   * sum a power of ten off, a decimal one would be sent more decimals than it
   * accepts, and either one's events would record money that never counts.
   * So no provider may take it; the ERP's currency is what needs fixing. */
  const {currencyCode, currencyScale} = prepared.data.money;
  if (currencyScale !== scaleOfCurrency(currencyCode)) {
    console.warn(
      `${currencyCode} has scale ${currencyScale} in the ERP but ${scaleOfCurrency(currencyCode)} at the providers; refusing to start`,
    );
    return {
      error: true,
      message: await t('This payment method is not available'),
    };
  }

  const {client} = tenant;
  const key = purchaseKey(checkoutToken, {
    source,
    money: prepared.data.money,
    subject: prepared.data.subject,
    snapshot: prepared.data.snapshot,
  });
  const existing = await client.aOSPortalPayment.findOne({
    where: {checkoutToken: key},
    select: {
      reference: true,
      status: true,
      source: true,
      portalWorkspace: {url: true},
    },
  });

  /* A checkout token belongs to one checkout; reused for another source it would
   * write that source's snapshot under this payment's row. */
  if (existing && existing.source !== source) {
    return {error: true, message: await t('Invalid payment request')};
  }

  /* A payment that can no longer be retried is shown as it stands. */
  const existingPage = existing && {
    success: true as const,
    data: {
      reference: existing.reference,
      handoff: {
        kind: 'page' as const,
        url: paymentPageUrl(
          tenant.id,
          existing.portalWorkspace.url,
          existing.reference,
        ),
      },
    },
  };
  if (existingPage && !canRetry(existing.status as PaymentStatus)) {
    return existingPage;
  }

  const idempotencyKey = randomUUID();
  const startedOn = new Date();
  const opened = await client.$transaction(async txClient => {
    /* The same purchase pressed again keeps its payment untouched: the key
     * says its money, subject and snapshot are what they were, so there is
     * nothing to write over and no session still open to write under. */
    const payment = existing
      ? await reopenPayment(
          txClient,
          existing.reference,
          prepared.data,
          gateway,
        )
      : await createPayment(
          txClient,
          tenant.id,
          source,
          key,
          prepared.data,
          gateway,
        );
    if (!payment) {
      return null;
    }

    if (!existing) {
      await writeSnapshot(txClient, payment.id, source, prepared.data.snapshot);
    }

    /* What this attempt asks the provider for, fixed with its key. It is
     * the payment's amount by construction: every session of a payment asks
     * for the whole amount due. */
    const session = await txClient.aOSPortalPaymentSession.create({
      data: {
        payment: {select: {id: payment.id}},
        gateway,
        idempotencyKey,
        amount: String(prepared.data.money.amount),
        currencyCode: prepared.data.money.currencyCode,
        currencyScale: prepared.data.money.currencyScale,
        status: SESSION_STATUS.initiated,
      },
      select: {id: true, version: true},
    });

    /* Written before the provider is called, so a session whose call never
     * comes back is still looked at; moved to the handoff's own expiry once
     * the provider has answered. */
    await scheduleReconcile(
      txClient,
      payment.id,
      reconcileSchedule({gateway, startedOn, expiresOn: null}),
    );

    return {
      paymentId: payment.id,
      reference: payment.reference,
      sessionId: session.id,
      sessionVersion: session.version,
    };
  });
  /* Captured, or otherwise past retrying, between the read above and the
   * lock: shown as it now stands, with no new session opened. */
  if (!opened) {
    return (
      existingPage ?? {error: true, message: await t('Invalid payment request')}
    );
  }
  const {paymentId, reference, sessionId, sessionVersion} = opened;

  const urls = tenantURLs(tenant.id);
  let created;
  try {
    created = await adapter.createSession(
      {
        reference,
        idempotencyKey,
        money: prepared.data.money,
        payer: prepared.data.payer,
        label: prepared.data.subjectLabel,
        returnUrl: urls.forExternal(`/api/payments/return/${gateway}`),
        billing: prepared.data.billing,
        option,
      },
      {tenantId: tenant.id, config: tenant.config},
    );
  } catch (error) {
    console.error(
      `Payment ${reference}: ${gateway} session could not be created`,
      error,
    );
    await client.aOSPortalPaymentSession.update({
      data: {
        id: sessionId,
        version: sessionVersion,
        failureReason: error instanceof Error ? error.message : String(error),
      },
      select: {id: true},
    });
    return {
      error: true,
      message: await t('The payment could not be started. Please try again.'),
    };
  }

  await client.$transaction(async txClient => {
    /* Conditional for the same reason as the payment update below: a settle
     * that already marked this session captured must not be written back to
     * awaiting, and must not make this transaction fail on a stale version. */
    await txClient.$raw(
      `UPDATE portal_portal_payment_session
         SET status = $2, session_ref = COALESCE(session_ref, $3),
             expires_on = COALESCE(expires_on, $4), version = version + 1, updated_on = now()
       WHERE id = $1 AND status = $5`,
      sessionId,
      SESSION_STATUS.awaiting,
      created.sessionRef,
      created.expiresOn,
      SESSION_STATUS.initiated,
    );
    /* Conditional, because a gateway that captures during its own session
     * creation may already have settled this payment: a capture that landed
     * in between must not be written back to awaiting. */
    await txClient.$raw(
      `UPDATE portal_portal_payment
         SET status = $2, gateway = $3, version = version + 1, updated_on = now()
       WHERE id = $1 AND status = $4`,
      paymentId,
      PAYMENT_STATUS.awaiting,
      gateway,
      PAYMENT_STATUS.initiated,
    );
    /* The provisional schedule gives way to one worked out from the
     * handoff's expiry, which the update above has just recorded. */
    await rescheduleFromSessions(txClient, paymentId);
  });

  return {success: true, data: {reference, handoff: created.handoff}};
}

async function createPayment(
  txClient: Client,
  tenantId: string,
  source: PaymentSource,
  checkoutToken: string,
  prepared: PreparedIntent,
  gateway: Gateway,
) {
  return txClient.aOSPortalPayment.create({
    data: {
      reference: mintReference(tenantId),
      checkoutToken,
      source,
      portalWorkspace: {select: {id: prepared.workspace.id}},
      portalAppConfig: {select: {id: prepared.workspace.configId}},
      subjectLabel: prepared.subjectLabel,
      payer: prepared.payer,
      amount: String(prepared.money.amount),
      capturedAmount: '0',
      currencyCode: prepared.money.currencyCode,
      currencyScale: prepared.money.currencyScale,
      status: PAYMENT_STATUS.initiated,
      gateway,
      fulfilmentStatus: FULFILMENT_STATUS.pending,
      ...paymentModeLink(prepared, gateway),
      ...subjectLinks(prepared),
    },
    select: {id: true, reference: true},
  });
}

/* A retry of the same purchase keeps the payment, its reference and
 * everything it was priced at; only what depends on the gateway pressed this
 * time moves with the new session. A different purchase has a different key
 * and never reaches here. Locked and checked again first: a capture that
 * committed since the caller looked must not be reset to initiated. Null when
 * the payment can no longer be retried. */
async function reopenPayment(
  txClient: Client,
  reference: string,
  prepared: PreparedIntent,
  gateway: Gateway,
) {
  await txClient.$raw(
    'SELECT id FROM portal_portal_payment WHERE reference = $1 FOR UPDATE',
    reference,
  );
  const payment = await txClient.aOSPortalPayment.findOne({
    where: {reference},
    select: {id: true, reference: true, status: true},
  });
  if (!payment) {
    throw new Error(`Payment ${reference} vanished`);
  }
  if (!canRetry(payment.status as PaymentStatus)) {
    return null;
  }
  await txClient.aOSPortalPayment.update({
    data: {
      id: payment.id,
      version: payment.version,
      status: PAYMENT_STATUS.initiated,
      gateway,
      ...paymentModeLink(prepared, gateway),
    },
    select: {id: true},
  });
  return {id: payment.id, reference: payment.reference};
}

function paymentModeLink(prepared: PreparedIntent, gateway: Gateway) {
  const paymentModeId = getPaymentModeId(
    prepared.paymentOptions,
    paymentOptionFor(gateway),
  );
  return paymentModeId
    ? {paymentMode: {select: {id: String(paymentModeId)}}}
    : {};
}

/* The subject a source knows before any money moves, such as the invoice
 * being paid: its prepare step has just read and authorised the record. */
function subjectLinks(prepared: PreparedIntent) {
  return prepared.subject ? subjectColumns(prepared.subject) : {};
}
