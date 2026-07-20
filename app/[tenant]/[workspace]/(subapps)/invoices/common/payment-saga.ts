// ---- CORE IMPORTS ---- //
import {SAGA_FAILURE_STATUS} from '@/lib/core/saga';
import type {SagaDefinition} from '@/lib/core/saga';
import type {PaymentSagaContext} from '@/lib/core/payment/saga/types';

// ---- LOCAL IMPORTS ---- //
import {updateInvoice} from '@/subapps/invoices/common/service';

/**
 * Post-capture business tail for invoice payments.
 *
 * updateInvoice routes to reconcile_required (never refund_required): the
 * customer paid money they owed on an existing invoice, so the admin records
 * the payment manually in the ERP — no money goes back. There is deliberately
 * no retry: the AOS endpoint has no idempotency protection, so re-running an
 * ambiguous failure could record the payment twice.
 */
export const invoicesPaymentSaga: SagaDefinition<PaymentSagaContext> = {
  steps: [
    {
      name: 'updateInvoice',
      onFailure: SAGA_FAILURE_STATUS.reconcileRequired,
      async execute(ctx) {
        if (!ctx.entityId) {
          throw new Error('Missing invoice id in context data');
        }
        if (ctx.amount == null) {
          throw new Error('Missing amount in context data');
        }

        const result = await updateInvoice({
          config: ctx.config,
          amount: ctx.amount,
          invoiceId: ctx.entityId,
          paymentModeId: ctx.paymentModeId,
        });

        if (result?.error) {
          throw new Error(result.message || 'Invoice update failed');
        }
      },
    },
  ],
};
