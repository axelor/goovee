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
