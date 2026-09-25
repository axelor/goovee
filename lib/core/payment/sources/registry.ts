import 'server-only';

import {z} from 'zod';

import {invoicesPaymentSource} from '@/subapps/invoices/common/payment/source';
import {marketplacePaymentSource} from '@/subapps/marketplace/common/payment/source';
import {eventsPaymentSource} from '@/subapps/events/common/payment/source';
import {shopPaymentSource} from '@/subapps/shop/common/payment/source';
import {PAYMENT_SOURCE, type PaymentSource} from '../domain/types';
import type {PaymentSourceHandler} from './types';

/* Adding a source is one handler and one entry here. The invoices source
 * reaches settle, which imports this registry, so only this registry imports
 * the source modules; anything else asks it for a handler. */
const handlers: {
  [Source in PaymentSource]: PaymentSourceHandler<unknown, Source>;
} = {
  [PAYMENT_SOURCE.invoices]: invoicesPaymentSource,
  [PAYMENT_SOURCE.marketplace]: marketplacePaymentSource,
  [PAYMENT_SOURCE.events]: eventsPaymentSource,
  [PAYMENT_SOURCE.shop]: shopPaymentSource,
};

export const PaymentSourceSchema = z.enum(
  Object.values(PAYMENT_SOURCE) as [PaymentSource, ...PaymentSource[]],
);

export function getSourceHandler(source: PaymentSource): PaymentSourceHandler {
  const handler: PaymentSourceHandler | undefined = handlers[source];
  if (!handler) {
    throw new Error(`No payment source handler for "${source}"`);
  }
  return handler;
}
