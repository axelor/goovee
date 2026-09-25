import 'server-only';

import {z} from 'zod';

import {PaymentOption} from '@/types';
import {GATEWAY, type Gateway} from '../domain/types';
import type {GatewayAdapter} from './types';
import {stripeCardAdapter} from './stripe-card';
import {stripeBankTransferAdapter} from './stripe-bank-transfer';
import {paypalAdapter} from './paypal';
import {payboxAdapter} from './paybox';
import {up2payAdapter} from './up2pay';
import {hubpispAdapter} from './hubpisp';

// Adding a provider is one adapter and one entry here.
const adapters: Record<Gateway, GatewayAdapter> = {
  [GATEWAY.stripeCard]: stripeCardAdapter,
  [GATEWAY.stripeBankTransfer]: stripeBankTransferAdapter,
  [GATEWAY.paypal]: paypalAdapter,
  [GATEWAY.paybox]: payboxAdapter,
  [GATEWAY.up2pay]: up2payAdapter,
  [GATEWAY.hubpisp]: hubpispAdapter,
};

export const GatewaySchema = z.enum(
  Object.values(GATEWAY) as [Gateway, ...Gateway[]],
);

/* A gateway read from a row or a request is only typed as one: an unknown
 * value still reaches here, and is refused by name. */
export function getAdapter(gateway: Gateway): GatewayAdapter {
  const adapter = adapters[gateway] as GatewayAdapter | undefined;
  if (!adapter) {
    throw new Error(`No adapter for gateway "${gateway}"`);
  }
  return adapter;
}

export function listAdapters(): GatewayAdapter[] {
  return Object.values(adapters);
}

/**
 * The workspace configuration names providers by the `typeSelect` of its
 * online payment methods, one per provider account. Both Stripe gateways are
 * offered by the same Stripe method.
 */
export function paymentOptionFor(gateway: Gateway): PaymentOption {
  switch (gateway) {
    case GATEWAY.stripeCard:
    case GATEWAY.stripeBankTransfer:
      return PaymentOption.stripe;
    case GATEWAY.paypal:
      return PaymentOption.paypal;
    case GATEWAY.paybox:
      return PaymentOption.paybox;
    case GATEWAY.up2pay:
      return PaymentOption.up2pay;
    case GATEWAY.hubpisp:
      return PaymentOption.hubpisp;
  }
}
