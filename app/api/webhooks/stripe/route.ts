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
import {PAYMENT_SOURCE} from '@/lib/core/payment/common/type';
import {getAmountFromStripe} from '@/utils/stripe';
import {manager} from '@/tenant';
import {scale} from '@/utils';
import {DEFAULT_CURRENCY_SCALE} from '@/constants';

// --- LOCAL IMPORTS ---- //
import {updateInvoice} from '@/subapps/invoices/common/service';
import {cancelInvalidPendingBankTransfers} from '@/lib/core/payment/stripe/actions';
import {STRIPE_PAYMENT_METHOD_TYPE} from '@/lib/core/payment/stripe/constants';

export const STRIPE_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
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
  const signature = headers().get('Stripe-Signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!signature || !webhookSecret) {
      return new NextResponse('Missing signature or webhook secret', {
        status: 400,
      });
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook verification failed', err.message);
    return new NextResponse('Webhook verification failed', {status: 400});
  }

  try {
    switch (event.type) {
      case STRIPE_EVENTS.PAYMENT_INTENT_SUCCEEDED: {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const contextId = paymentIntent.metadata.context_id;
        const tenantId = paymentIntent.metadata.tenant_id;

        if (!contextId || !tenantId) {
          console.error('Missing metadata', paymentIntent.metadata);
          break;
        }

        const paymentContext = await findPaymentContext({
          id: contextId,
          tenantId,
          mode: PaymentOption.stripe,
          ignoreExpiration: true,
        });

        if (!paymentContext) {
          console.error('Payment context not found', contextId);
          break;
        }

        if (paymentContext.status === CONTEXT_STATUS.processed) {
          console.log('Already processed, skipping');
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
          break;
        }

        const paidAmount = getAmountFromStripe(
          paymentIntent.amount_received,
          paymentIntent.currency,
        );

        const client = await manager.getClient(tenantId);

        switch (source) {
          case PAYMENT_SOURCE.INVOICES: {
            const paymentMethodType = paymentIntent.payment_method_types?.[0];

            // Only handle bank transfers
            if (
              paymentMethodType !== STRIPE_PAYMENT_METHOD_TYPE.CUSTOMER_BALANCE
            ) {
              break;
            }

            const updateResult = await updateInvoice({
              tenantId,
              amount: paidAmount,
              invoiceId: sourceId,
            });
            if (updateResult?.error) {
              console.error('Invoice update failed:', updateResult.error);
              break;
            }

            await markPaymentAsProcessed({
              contextId: paymentContext.id,
              version: paymentContext.version,
              tenantId,
            });

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
              console.error('Invoice not found:', sourceId);
              break;
            }

            const amountRemaining = Number(
              scale(
                Number(invoice.amountRemaining),
                invoice?.currency.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE,
              ),
            );

            await cancelInvalidPendingBankTransfers({
              tenantId,
              sourceId: invoice.id,
              amountRemaining,
            });

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

      default:
        console.log('Unhandled Stripe event:', event.type);
    }
  } catch (error) {
    console.error('🔥 Error processing webhook:', error);
  }

  return new NextResponse(JSON.stringify({received: true}), {
    status: 200,
    headers: {'Content-Type': 'application/json'},
  });
}
