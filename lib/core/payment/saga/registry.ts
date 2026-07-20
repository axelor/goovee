// ---- CORE IMPORTS ---- //
import type {SagaDefinition} from '@/lib/core/saga';
import {PAYMENT_SOURCE} from '../common/type';
import type {PaymentSource} from '../common/type';

// ---- LOCAL IMPORTS ---- //
import {eventsPaymentSaga} from '@/subapps/events/common/payment-saga';
import {invoicesPaymentSaga} from '@/subapps/invoices/common/payment-saga';
import {shopPaymentSaga} from '@/subapps/shop/common/payment-saga';
import type {PaymentSagaContext} from './types';

/**
 * One saga definition per payment source. Adding a source is a single entry
 * here — every webhook and redirect-return caller goes through
 * completePayment() and picks it up automatically.
 */
const definitions: Partial<
  Record<PaymentSource, SagaDefinition<PaymentSagaContext>>
> = {
  [PAYMENT_SOURCE.INVOICES]: invoicesPaymentSaga,
  [PAYMENT_SOURCE.SHOP]: shopPaymentSaga,
  [PAYMENT_SOURCE.EVENTS]: eventsPaymentSaga,
};

export function getPaymentSagaDefinition(
  source: PaymentSource,
): SagaDefinition<PaymentSagaContext> | undefined {
  return definitions[source];
}
