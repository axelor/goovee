import {NextResponse} from 'next/server';
import {headers} from 'next/headers';
import Stripe from 'stripe';

// ---- CORE IMPORTS ---- //
import {stripe} from '@/payment/stripe';
import {
  CONTEXT_STATUS,
  findPaymentContext,
  markPaymentAsFailed,
  markPaymentAsProcessed,
} from '@/lib/core/payment/common/orm';
import {PaymentOption} from '@/types';
import {PAYMENT_SOURCE, PAYMENT_TYPE} from '@/lib/core/payment/common/type';
import {getAmountFromStripe} from '@/utils/stripe';
import {manager} from '@/tenant';
import {scale} from '@/utils';
import {DEFAULT_CURRENCY_SCALE} from '@/constants';
import {cancelInvalidPendingBankTransfers} from '@/lib/core/payment/stripe/actions';
import {
  notifyPaymentUpdate,
  PAYMENT_UPDATE_STATUS,
} from '@/lib/core/payment/sse';
// --- LOCAL IMPORTS ---- //
import {updateInvoice} from '@/subapps/invoices/common/service';
import {notifyInvoicePaymentSuccess} from '@/subapps/invoices/common/utils/notify';

export const STRIPE_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_PARTIALLY_FUNDED: 'payment_intent.partially_funded',
} as const;

export type StripeEventType =
  (typeof STRIPE_EVENTS)[keyof typeof STRIPE_EVENTS];

async function handleWebhookPaymentFailure({
  paymentContext,
  tenantId,
  reason,
}: {
  paymentContext: {id: string; version: number};
  tenantId: string;
  reason: string;
}) {
  console.error('Payment processing failed', {
    contextId: paymentContext.id,
    reason,
  });

  await markPaymentAsFailed({
    contextId: paymentContext.id,
    version: paymentContext.version,
    tenantId,
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const $headers = await headers();
  const signature = $headers.get('Stripe-Signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

        const paymentContext = await findPaymentContext({
          id: contextId,
          tenantId,
          mode: PaymentOption.stripe,
          ignoreExpiration: true,
        });

        if (!paymentContext) {
          // Return 500 so Stripe retries — events can arrive out of order
          console.error('Payment context not found', {
            eventId: event.id,
            contextId,
          });
          return new NextResponse('Payment context not found', {status: 500});
        }

        if (paymentContext.status === CONTEXT_STATUS.processed) {
          console.log('Already processed, skipping');
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

        if (!source || !sourceId) {
          await handleWebhookPaymentFailure({
            paymentContext,
            tenantId,
            reason: 'Missing payment source',
          });
          // Permanent error — corrupted context data. Return 200 to stop Stripe retries.
          break;
        }

        const paidAmount = getAmountFromStripe(
          paymentIntent.amount_received,
          paymentIntent.currency,
        );

        const client = await manager.getClient(tenantId);

        switch (source) {
          case PAYMENT_SOURCE.INVOICES: {
            const invoice = await client.aOSInvoice.findOne({
              where: {id: sourceId},
              select: {
                id: true,
                amountRemaining: true,
                currency: {
                  numberOfDecimals: true,
                },
              },
            });

            if (!invoice) {
              console.error('Invoice not found for received payment', {
                sourceId,
              });
              return new NextResponse('Invoice not found', {status: 500});
            }

            const updateResult = await updateInvoice({
              tenantId,
              amount: paidAmount,
              invoiceId: sourceId,
              paymentModeId: paymentContext.data?.paymentModeId,
            });

            if (updateResult?.error) {
              // Do NOT mark as failed — payment was already received by Stripe.
              // Return 500 so Stripe retries the webhook for this transient error.
              console.error(
                '[STRIPE][WEBHOOK] Invoice update failed: ',
                updateResult.message,
              );
              return new NextResponse('Invoice update failed', {status: 500});
            }

            await markPaymentAsProcessed({
              contextId: paymentContext.id,
              version: paymentContext.version,
              tenantId,
            });

            // Once the payment is applied, reload the invoice to ensure the remaining balance
            // is accurate, and cancel any pending bank transfers that are no longer necessary.
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
              tenantId,
              sourceId: invoice.id,
              amountRemaining,
            });

            notifyPaymentUpdate(source, sourceId, paymentContext.id);
            if (paymentContext.payer) {
              notifyInvoicePaymentSuccess({
                invoiceId: sourceId,
                payer: paymentContext.payer,
                tenantId,
              });
            }

            break;
          }

          case PAYMENT_SOURCE.SHOP:
          case PAYMENT_SOURCE.EVENTS:
            console.warn('Source not implemented:', source);
            break;

          default:
            console.warn('Unknown payment source:', source);
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

        const paymentContext = await findPaymentContext({
          id: contextId,
          tenantId,
          mode: PaymentOption.stripe,
          ignoreExpiration: true,
        });

        if (!paymentContext) {
          console.error('[PARTIAL_PAYMENT] Payment context not found', {
            eventId: event.id,
            contextId,
          });

          return new NextResponse('Payment context not found', {status: 500});
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
