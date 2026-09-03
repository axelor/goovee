import 'server-only';

import Stripe from 'stripe';

import type {TenantConfig} from '@/tenant';

/* Clients are cached per secret so tenants sharing an account share a
 * client, and the SDK's connection pooling is preserved. */
const clients = new Map<string, Stripe>();

export function getStripe(config?: TenantConfig | null): Stripe {
  const secret = config?.payments?.stripe?.clientSecret;

  if (!secret) {
    throw new Error('Stripe is not configured');
  }

  let client = clients.get(secret);
  if (!client) {
    client = new Stripe(secret);
    clients.set(secret, client);
  }

  return client;
}

export function getStripeWebhookSecret(
  config?: TenantConfig | null,
): string | undefined {
  return config?.payments?.stripe?.webhookSecret;
}

/**
 * Whether this tenant can settle a Stripe bank transfer.
 *
 * A transfer is confirmed only by a `payment_intent.succeeded` delivery, which
 * the tenant's webhook endpoint verifies with this secret; nothing in the
 * request path confirms one. Offering the option without it shows the payer real
 * bank details and leaves the invoice unpaid after the money has reached Stripe.
 *
 * Card payments do not depend on it: their return leg confirms the Checkout
 * session against Stripe before settling.
 */
export function canSettleStripeBankTransfer(
  config?: TenantConfig | null,
): boolean {
  return Boolean(getStripeWebhookSecret(config));
}
