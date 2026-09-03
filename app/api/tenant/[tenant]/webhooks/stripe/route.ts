import {taintSecret} from '@/lib/core/security/taint';
import {NextResponse, after} from 'next/server';
import {headers} from 'next/headers';
import Stripe from 'stripe';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import {getStripe, getStripeWebhookSecret} from '@/payment/stripe';
import {getTenantConfig} from '@/tenant/config';
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
  client,
  reason,
}: {
  paymentContext: {id: string; version: number};
  client: Client;
  reason: string;
}) {
  console.error('Payment processing failed', {
    contextId: paymentContext.id,
    reason,
  });

  await markPaymentAsFailed({
    contextId: paymentContext.id,
    version: paymentContext.version,
    client,
  });
}

/* A Stripe account delivers every event to every endpoint enabled on it, and
 * each endpoint's signing secret verifies its own delivery — so a verified
 * event proves which account sent it, never which tenant it was created for,
 * and two tenants configured against one account each receive the other's
 * events. Payment context ids are per-tenant sequences that both start at 1,
 * so a foreign intent can name a pending context here: its amount would be
 * credited to this tenant's invoice, and the context a payment still on its way
 * needs would be spent.
 *
 * A missing tenant is not a mismatch: no intent this application creates
 * carries a context id without one. A producer added later must set both, or
 * this check silently stops covering its intents. */
function belongsToTenant(
  paymentIntent: Stripe.PaymentIntent,
  tenantId: string,
  eventId: string,
) {
  const intentTenantId = paymentIntent.metadata.tenant_id;

  if (intentTenantId && intentTenantId !== tenantId) {
    console.error('Stripe event belongs to another tenant', {
      eventId,
      intentTenantId,
      tenantId,
      paymentIntentId: paymentIntent.id,
    });

    return false;
  }

  return true;
}

export async function POST(
  req: Request,
  props: {params: Promise<{tenant: string}>},
) {
  const {tenant: tenantId} = await props.params;

  const body = await req.text();
  const $headers = await headers();
  const signature = $headers.get('Stripe-Signature');

  /* The tenant comes from the path (the webhook URL is registered per tenant),
   * so its webhook secret is selected without reading the untrusted payload.
   * The event is still trusted only after constructEvent verifies the signature
   * against that secret. */
  const tenantConfig = getTenantConfig(tenantId);

  const webhookSecret = getStripeWebhookSecret(tenantConfig);

  taintSecret(
    'Stripe webhook secret is a server secret. Do not pass to Client Components.',
    webhookSecret,
  );

  let event: Stripe.Event;

  try {
    if (!signature || !webhookSecret) {
      return new NextResponse('Missing signature or webhook secret', {
        status: 400,
      });
    }

    event = getStripe(tenantConfig).webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );
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

        if (!contextId) {
          console.error('Missing payment metadata', {
            eventId: event.id,
            metadata: paymentIntent.metadata,
          });
          // Permanent error — retrying won't fix missing metadata. Return 200 to stop Stripe retries.
          break;
        }

        if (!belongsToTenant(paymentIntent, tenantId, event.id)) {
          // Permanent — the intent names another tenant. Return 200 to stop Stripe retries.
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
            client,
            reason: 'Missing payment source',
          });
          // Permanent error — corrupted context data. Return 200 to stop Stripe retries.
          break;
        }

        const paidAmount = getAmountFromStripe(
          paymentIntent.amount_received,
          paymentIntent.currency,
        );

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
              config,
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

            try {
              await client.$transaction(async txClient => {
                await markPaymentAsProcessed({
                  contextId: paymentContext.id,
                  version: paymentContext.version,
                  client: txClient,
                });

                // Once the payment is applied, reload the invoice to ensure the remaining balance
                // is accurate, and cancel any pending bank transfers that are no longer necessary.
                const updatedInvoice = await txClient.aOSInvoice.findOne({
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
                  client: txClient,
                  sourceId: invoice.id,
                  amountRemaining,
                  tenantId,
                });
              });
            } catch (err) {
              console.error(
                '[STRIPE][WEBHOOK] Post-payment transaction failed',
                {
                  contextId: paymentContext.id,
                  sourceId,
                  error: err instanceof Error ? err.message : err,
                },
              );
              return new NextResponse('Post-payment processing failed', {
                status: 500,
              });
            }

            notifyPaymentUpdate(tenantId, source, sourceId, paymentContext.id);
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

        if (!contextId) {
          console.error('[PARTIAL_PAYMENT] Missing payment metadata', {
            eventId: event.id,
            metadata: paymentIntent.metadata,
          });
          break;
        }

        if (!belongsToTenant(paymentIntent, tenantId, event.id)) {
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
            tenantId,
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
