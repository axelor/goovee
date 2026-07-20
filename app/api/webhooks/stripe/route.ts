import {experimental_taintUniqueValue} from 'react';
import {NextResponse, after} from 'next/server';
import {headers} from 'next/headers';
import Stripe from 'stripe';

// ---- CORE IMPORTS ---- //
import {stripe} from '@/payment/stripe';
import {
  CONTEXT_STATUS,
  findPaymentContext,
} from '@/lib/core/payment/common/orm';
import {PaymentOption} from '@/types';
import {PAYMENT_SOURCE, PAYMENT_TYPE} from '@/lib/core/payment/common/type';
import {getAmountFromStripe} from '@/utils/stripe';
import {manager} from '@/tenant';
import {scale} from '@/utils';
import {DEFAULT_CURRENCY_SCALE} from '@/constants';
import {cancelInvalidPendingBankTransfers} from '@/lib/core/payment/stripe/actions';
import {completePayment} from '@/lib/core/payment/saga';
import {SAGA_OUTCOME_STATUS} from '@/lib/core/saga';
import {
  notifyPaymentUpdate,
  PAYMENT_UPDATE_STATUS,
} from '@/lib/core/payment/sse';
// --- LOCAL IMPORTS ---- //
import {notifyInvoicePaymentSuccess} from '@/subapps/invoices/common/utils/notify';

export const STRIPE_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_PARTIALLY_FUNDED: 'payment_intent.partially_funded',
} as const;

export type StripeEventType =
  (typeof STRIPE_EVENTS)[keyof typeof STRIPE_EVENTS];

export async function POST(req: Request) {
  const body = await req.text();
  const $headers = await headers();
  const signature = $headers.get('Stripe-Signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret) {
    experimental_taintUniqueValue(
      'Stripe webhook secret is a server secret. Do not pass to Client Components.',
      process,
      webhookSecret,
    );
  }

  let event: Stripe.Event;

  try {
    if (!signature || !webhookSecret) {
      return new NextResponse('Missing signature or webhook secret', {
        status: 400,
      });
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(
      'Stripe webhook verification failed',
      err instanceof Error ? err.message : err,
    );
    return new NextResponse('Webhook verification failed', {status: 400});
  }

  try {
    switch (event.type) {
      case STRIPE_EVENTS.PAYMENT_INTENT_SUCCEEDED: {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        console.log('Processing Stripe event', {
          eventId: event.id,
          type: event.type,
          paymentIntentId: paymentIntent.id,
        });

        const contextId = paymentIntent.metadata.context_id;
        const tenantId = paymentIntent.metadata.tenant_id;

        if (!contextId || !tenantId) {
          console.error('Missing payment metadata', {
            eventId: event.id,
            metadata: paymentIntent.metadata,
          });
          // Permanent error — retrying won't fix missing metadata. Return 200 to stop Stripe retries.
          break;
        }

        const tenant = await manager.getTenant(tenantId);
        if (!tenant) {
          console.error('Tenant not found', {tenantId});
          return new NextResponse('Tenant not found', {status: 500});
        }
        const {client, config} = tenant;

        const paymentContext = await findPaymentContext({
          id: contextId,
          client,
          mode: PaymentOption.stripe,
          ignoreStatus: true,
        });

        if (!paymentContext) {
          // Return 500 so Stripe retries — events can arrive out of order
          console.error('Payment context not found', {
            eventId: event.id,
            contextId,
          });
          return new NextResponse('Payment context not found', {status: 500});
        }

        if (paymentContext.status !== CONTEXT_STATUS.pending) {
          // Already claimed (processing) or terminal (processed / cancelled /
          // failed / expired) — redelivery cannot help past the claim.
          console.log('Context already handled, skipping', {
            contextId,
            status: paymentContext.status,
          });
          return new NextResponse(JSON.stringify({received: true}), {
            status: 200,
            headers: {'Content-Type': 'application/json'},
          });
        }

        // Only process bank transfer payments here — card payments are validated
        // directly in the respective source app actions (not via webhook).
        if (paymentContext.data?.paymentType !== PAYMENT_TYPE.BANK_TRANSFER) {
          console.log('Skipping non-bank-transfer payment intent');
          break;
        }

        const source = paymentContext.data.source;
        const sourceId = paymentContext.data.id;

        const paidAmount = getAmountFromStripe(
          paymentIntent.amount_received,
          paymentIntent.currency,
        );

        /* No business pre-checks before the claim: once money is captured,
         * every failure must terminate in a saga failure queue where a human
         * will see it. Pre-claim 500s are reserved for transient errors
         * (tenant/context lookup, the outer catch-all) — answering a
         * permanent condition with 500 would strand the context in `pending`
         * once Stripe stops redelivering. */
        const outcome = await completePayment({
          tenantId,
          client,
          config,
          paymentContext,
          amount: paidAmount,
          providerTransactionRef: paymentIntent.id,
        });

        if (outcome.status === SAGA_OUTCOME_STATUS.notClaimed) {
          console.log('Context claimed by another runner, skipping', {
            contextId,
          });
          break;
        }

        if (outcome.status !== SAGA_OUTCOME_STATUS.completed) {
          // Post-claim failure is terminal (flagged for the ERP queues) —
          // acknowledge with 200, redelivery cannot help anymore.
          console.error('[STRIPE][WEBHOOK] Payment saga failed', {
            contextId,
            outcome,
          });
          break;
        }

        if (source === PAYMENT_SOURCE.INVOICES) {
          /* Once the payment is applied, reload the invoice to ensure the
           * remaining balance is accurate, and cancel any pending bank
           * transfers that are no longer necessary. Cleanup failure must not
           * fail the webhook — the payment itself is fully processed. */
          try {
            const updatedInvoice = await client.aOSInvoice.findOne({
              where: {id: sourceId},
              select: {
                id: true,
                amountRemaining: true,
                currency: {
                  numberOfDecimals: true,
                },
              },
            });

            const amountRemaining = Number(
              scale(
                Number(updatedInvoice?.amountRemaining ?? 0),
                updatedInvoice?.currency?.numberOfDecimals ??
                  DEFAULT_CURRENCY_SCALE,
              ),
            );

            await cancelInvalidPendingBankTransfers({
              client,
              sourceId,
              amountRemaining,
            });
          } catch (err) {
            console.error(
              '[STRIPE][WEBHOOK] Stale bank transfer cleanup failed',
              {
                contextId,
                sourceId,
                error: err instanceof Error ? err.message : err,
              },
            );
          }

          if (paymentContext.payer) {
            after(() =>
              notifyInvoicePaymentSuccess({
                invoiceId: sourceId,
                payer: paymentContext.payer!,
                tenantId,
                client,
              }),
            );
          }
        }

        break;
      }

      case STRIPE_EVENTS.PAYMENT_INTENT_PARTIALLY_FUNDED: {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const contextId = paymentIntent.metadata.context_id;
        const tenantId = paymentIntent.metadata.tenant_id;

        if (!contextId || !tenantId) {
          console.error('[PARTIAL_PAYMENT] Missing payment metadata', {
            eventId: event.id,
            metadata: paymentIntent.metadata,
          });
          break;
        }

        const tenant = await manager.getTenant(tenantId);
        if (!tenant) {
          console.error('[PARTIAL_PAYMENT] Tenant not found', {tenantId});
          return new NextResponse('Tenant not found', {status: 500});
        }
        const {client} = tenant;

        const paymentContext = await findPaymentContext({
          id: contextId,
          client: client,
          mode: PaymentOption.stripe,
          ignoreStatus: true,
        });

        if (!paymentContext) {
          console.error('[PARTIAL_PAYMENT] Payment context not found', {
            eventId: event.id,
            contextId,
          });

          return new NextResponse('Payment context not found', {status: 500});
        }

        if (paymentContext.status !== CONTEXT_STATUS.pending) {
          console.log('[PARTIAL_PAYMENT] Context already handled, skipping', {
            contextId,
            status: paymentContext.status,
          });
          break;
        }

        const source = paymentContext.data?.source;
        const sourceId = paymentContext.data?.id;

        if (!source || !sourceId) {
          console.error('[PARTIAL_PAYMENT] Missing source in payment context', {
            contextId,
          });
          break;
        }

        try {
          notifyPaymentUpdate(
            source,
            sourceId,
            paymentContext.id,
            PAYMENT_UPDATE_STATUS.PARTIAL,
          );
        } catch (error) {
          console.error('[PARTIAL_PAYMENT] Failed to send SSE notification', {
            contextId: paymentContext.id,
            error,
          });
        }

        break;
      }

      default:
        console.log('Unhandled Stripe event:', event.type);
    }
  } catch (error) {
    console.error('🔥 Error processing webhook:', error);
    return new NextResponse('Internal server error', {status: 500});
  }

  return new NextResponse(JSON.stringify({received: true}), {
    status: 200,
    headers: {'Content-Type': 'application/json'},
  });
}
