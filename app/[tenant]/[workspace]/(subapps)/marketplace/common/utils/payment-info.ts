import type {Client} from '@/goovee/.generated/client';
import type {PaymentOrder} from '@/lib/core/payment/common/type';
import {findPayboxOrder} from '@/payment/paybox/actions';
import {findPaypalOrder} from '@/payment/paypal/actions';
import {findStripeOrder} from '@/payment/stripe/actions';
import {PaymentOption} from '@/types';

/* Marketplace-local copy of events/common/utils/validate.ts:getPaymentInfo.
 * Pulls the validated cart back from PaymentContext keyed by the
 * provider's identifier (stripe session id, paypal order id, paybox
 * params). Returns `{amount, context}` or throws. */
export async function getPaymentInfo({
  mode,
  data,
  client,
}: {
  mode: PaymentOption;
  data: {id?: string; params?: any};
  client: Client;
}): Promise<PaymentOrder> {
  switch (mode) {
    case PaymentOption.stripe: {
      if (!data.id) throw new Error('Stripe payment requires an ID');
      return findStripeOrder({id: data.id, client});
    }
    case PaymentOption.paypal: {
      if (!data.id) throw new Error('PayPal payment requires an ID');
      return findPaypalOrder({id: data.id, client});
    }
    case PaymentOption.paybox: {
      if (!data.params) throw new Error('Paybox payment requires parameters');
      return findPayboxOrder({params: data.params, client});
    }
    default:
      throw new Error('Invalid payment mode');
  }
}
