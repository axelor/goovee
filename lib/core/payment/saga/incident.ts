// ---- CORE IMPORTS ---- //
import {BigDecimal} from '@goovee/orm';
import type {Client} from '@/goovee/.generated/client';
import type {SagaFailure} from '@/lib/core/saga';
import type {PaymentContext} from '../common/type';

/**
 * Payment incidents are the AOS-side projection of the failure queues, shown
 * in the ERP's Payments menus. The table is AOS-owned
 * (portal_portal_payment_incident); goovee only ever creates or refreshes the
 * open incident here, in the same code path that persists the failure on the
 * payment context, so the two records cannot drift. Resolution is AOS's:
 * its fix buttons run the missing operation in-process and flip status to
 * resolved (then notify goovee via the payment-incident webhook so the
 * context catches up).
 */
export const INCIDENT_STATUS = {
  open: 'open',
  resolved: 'resolved',
} as const;

/* mode is a PaymentOption value, typed loose because the startup sweep reads
 * it raw from the DB. */
type IncidentContext = Pick<PaymentContext, 'id' | 'payer' | 'data'> & {
  mode?: string | null;
};

/**
 * Creates the incident for a terminal saga failure, or refreshes the existing
 * one (one incident per context — paymentContextId is unique; the startup
 * sweep may re-record a context it already flagged). Best-effort by design:
 * the saga outcome is already persisted on the context, so a failure here
 * only delays ERP visibility and must never alter the outcome.
 */
export async function recordPaymentIncident({
  client,
  paymentContext,
  failure,
}: {
  client: Client;
  paymentContext: IncidentContext;
  failure: SagaFailure;
}): Promise<void> {
  try {
    const {id: contextId, payer, data, mode} = paymentContext;
    const source = data?.source;

    const fields = {
      source: source ?? null,
      entityId: data?.id ?? null,
      payerEmail: payer ?? null,
      paidAmount:
        data?.amount != null ? new BigDecimal(String(data.amount)) : null,
      /* Shop / invoices: paid < due flags a legitimate partial payment vs a
       * mismatch. Null where paid is by definition the due (events). */
      amountDue:
        data?.amountDue != null ? new BigDecimal(String(data.amountDue)) : null,
      currencyCode: data?.currencyCode ?? null,
      /* Provider (stripe/paypal/...) + its transaction id: what the admin
       * needs to find or refund the charge in the provider dashboard. */
      paymentMode: mode ?? null,
      providerTransactionRef: data?.providerTransactionRef ?? null,
      /* Inputs the ERP fix actions replay with (events "Create invoice"). */
      paymentModeId: data?.paymentModeId ?? null,
      partnerWorkspaceId: data?.partnerWorkspaceId ?? null,
      queue: failure.status,
      failedStep: failure.step,
      /* AOS-reported stage inside the failed step (shop createOrder only). */
      failedStage: failure.stage ?? null,
      failureReason: failure.reason,
      errorDetail: failure.detail || null,
      status: INCIDENT_STATUS.open,
      updatedOn: new Date(),
    };

    const existing = await client.aOSPortalPaymentIncident.findOne({
      where: {paymentContextId: contextId},
      select: {id: true, version: true},
    });

    if (existing) {
      await client.aOSPortalPaymentIncident.update({
        data: {id: existing.id, version: existing.version, ...fields},
        select: {id: true},
      });
    } else {
      await client.aOSPortalPaymentIncident.create({
        data: {paymentContextId: contextId, ...fields, createdOn: new Date()},
        select: {id: true},
      });
    }
  } catch (err) {
    console.error('[PAYMENT-INCIDENT] Failed to record incident', {
      contextId: paymentContext.id,
      step: failure.step,
      error: err instanceof Error ? err.message : err,
    });
  }
}
