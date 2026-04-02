import {
  markPaymentAsCancelled,
  markPaymentAsFailed,
  markPaymentAsProcessed,
} from '../common/orm';
import {notifyPaymentUpdate, PAYMENT_UPDATE_STATUS} from '../sse';
import {PAYMENT_SOURCE} from '../common/type';
import type {PaymentContext} from '../common/type';
import {HUBPISP_TRANSACTION_STATUS} from './constants';

// ---- LOCAL IMPORTS ---- //
import {updateInvoice} from '@/subapps/invoices/common/service';
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
  tenantId,
}: {
  paymentContext: PaymentContext;
  transactionStatus: string;
  statusReasonInformation?: string;
  tenantId: string;
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
        tenantId,
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
        statusReasonInformation,
      });
      await markPaymentAsFailed({
        contextId: paymentContext.id,
        version: paymentContext.version,
        tenantId,
      });
      notifyPaymentUpdate(
        paymentContext.data.source,
        paymentContext.data.id,
        paymentContext.id,
        PAYMENT_UPDATE_STATUS.FAILED,
      );
      return true;

    case HUBPISP_TRANSACTION_STATUS.ACSC:
      await processAcscPayment({paymentContext, tenantId});
      return true;

    default:
      return false;
  }
}

export async function processAcscPayment({
  paymentContext,
  tenantId,
}: {
  paymentContext: PaymentContext;
  tenantId: string;
}): Promise<void> {
  const source = paymentContext.data?.source;
  const entityId = paymentContext.data?.id;
  const paidAmount = paymentContext.data?.amount;

  switch (source) {
    case PAYMENT_SOURCE.INVOICES: {
      const result = await updateInvoice({
        tenantId,
        amount: paidAmount,
        invoiceId: entityId,
        paymentModeId: paymentContext.data?.paymentModeId,
      });

      if (result?.error) {
        console.error(`'[HUBPISP][WEBHOOK]' Invoice update failed`, {
          invoiceId: entityId,
          error: result.error,
        });
        await markPaymentAsFailed({
          contextId: paymentContext.id,
          version: paymentContext.version,
          tenantId,
        });
        return;
      }

      if (paymentContext.payer) {
        notifyInvoicePaymentSuccess({
          invoiceId: entityId,
          payer: paymentContext.payer,
          tenantId,
        });
      }
      break;
    }

    case PAYMENT_SOURCE.SHOP:
    case PAYMENT_SOURCE.EVENTS:
      console.warn(`'[HUBPISP][WEBHOOK]' Source not implemented:`, source);
      return;

    default:
      console.error(`'[HUBPISP][WEBHOOK]' Unknown payment source:`, source);
      await markPaymentAsFailed({
        contextId: paymentContext.id,
        version: paymentContext.version,
        tenantId,
      });
      return;
  }

  await markPaymentAsProcessed({
    contextId: paymentContext.id,
    version: paymentContext.version,
    tenantId,
  });

  notifyPaymentUpdate(source, entityId, paymentContext.id);
}
