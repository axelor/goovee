import type {Client} from '@/goovee/.generated/client';
import type {TenantConfig} from '@/tenant';
import {after} from 'next/server';
import {markPaymentAsCancelled, markPaymentAsFailed} from '../common/orm';
import {notifyPaymentUpdate, PAYMENT_UPDATE_STATUS} from '../sse';
import {PAYMENT_SOURCE} from '../common/type';
import type {PaymentContext} from '../common/type';
import {completePayment} from '../saga';
import {SAGA_OUTCOME_STATUS} from '@/lib/core/saga';
import {HUBPISP_TRANSACTION_STATUS} from './constants';

// ---- LOCAL IMPORTS ---- //
import {notifyInvoicePaymentSuccess} from '@/subapps/invoices/common/utils/notify';

/**
 * Applies a terminal transaction status (ACSC / CANC / RJCT) to the payment context:
 * marks it in the DB and fires the SSE notification.
 *
 * Returns true when the status was terminal and handled, false when it is non-terminal
 * (so callers can decide to keep polling).
 */
export async function applyTransactionStatus({
  paymentContext,
  transactionStatus,
  statusReasonInformation,
  client,
  tenantId,
  config,
  deferNotifications = false,
}: {
  paymentContext: PaymentContext;
  transactionStatus: string;
  statusReasonInformation?: string;
  client: Client;
  tenantId: string;
  config: TenantConfig;
  deferNotifications?: boolean;
}): Promise<boolean> {
  switch (transactionStatus) {
    case HUBPISP_TRANSACTION_STATUS.CANC:
      console.warn(`'[HUBPISP][WEBHOOK]' Payment cancelled`, {
        contextId: paymentContext.id,
        statusReasonInformation,
      });
      await markPaymentAsCancelled({
        contextId: paymentContext.id,
        version: paymentContext.version,
        client,
      });
      notifyPaymentUpdate(
        paymentContext.data.source,
        paymentContext.data.id,
        paymentContext.id,
        PAYMENT_UPDATE_STATUS.CANCELLED,
      );
      return true;

    case HUBPISP_TRANSACTION_STATUS.RJCT:
      console.warn(`'[HUBPISP][WEBHOOK]' Payment rejected`, {
        contextId: paymentContext.id,
        transactionStatus,
        statusReasonInformation,
      });
      await markPaymentAsFailed({
        contextId: paymentContext.id,
        version: paymentContext.version,
        client,
      });
      notifyPaymentUpdate(
        paymentContext.data.source,
        paymentContext.data.id,
        paymentContext.id,
        PAYMENT_UPDATE_STATUS.FAILED,
      );
      return true;

    case HUBPISP_TRANSACTION_STATUS.ACSC:
      await processAcscPayment({
        paymentContext,
        client,
        tenantId,
        config,
        deferNotifications,
      });
      return true;

    default:
      return false;
  }
}

export async function processAcscPayment({
  paymentContext,
  client,
  tenantId,
  config,
  deferNotifications = false,
}: {
  paymentContext: PaymentContext;
  client: Client;
  tenantId: string;
  config: TenantConfig;
  deferNotifications?: boolean;
}): Promise<void> {
  const source = paymentContext.data?.source;
  const entityId = paymentContext.data?.id;

  const outcome = await completePayment({
    tenantId,
    client,
    config,
    paymentContext,
    // The payment-link resourceId is the reference BPCE support works from.
    providerTransactionRef: paymentContext.data?.resourceId ?? null,
  });

  if (outcome.status === SAGA_OUTCOME_STATUS.notClaimed) {
    // Concurrent webhook/poller already owns this context.
    console.log(`'[HUBPISP][WEBHOOK]' Context claimed by another runner`, {
      contextId: paymentContext.id,
    });
    return;
  }

  if (outcome.status !== SAGA_OUTCOME_STATUS.completed) {
    // Terminal — flagged for the ERP queues; polling must not resume.
    console.error(`'[HUBPISP][WEBHOOK]' Payment saga failed`, {
      contextId: paymentContext.id,
      outcome,
    });
    return;
  }

  if (source === PAYMENT_SOURCE.INVOICES && entityId && paymentContext.payer) {
    const notifyPaymentSuccess = () =>
      notifyInvoicePaymentSuccess({
        invoiceId: entityId,
        payer: paymentContext.payer!,
        tenantId,
        client,
      });

    if (deferNotifications) {
      after(notifyPaymentSuccess);
    } else {
      await notifyPaymentSuccess();
    }
  }
}
