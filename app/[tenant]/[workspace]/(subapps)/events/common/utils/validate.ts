// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import {t} from '@/locale/server';
import {findPayboxOrder} from '@/payment/paybox/actions';
import {findPaypalOrder} from '@/payment/paypal/actions';
import {findStripeOrder} from '@/payment/stripe/actions';
import {PaymentOption} from '@/types';
import type {ActionResponse} from '@/types/action';
import type {PaymentOrder} from '@/lib/core/payment/common/type';

// ---- LOCAL IMPORTS ---- //
import {error} from './index';

export const getPaymentInfo = async ({
  mode,
  data,
  tenantId,
  client,
}: {
  mode: PaymentOption;
  data: {id?: string; params?: unknown};
  tenantId: string;
  client: Client;
}): Promise<ActionResponse<PaymentOrder>> => {
  try {
    switch (mode) {
      case PaymentOption.stripe: {
        const {id} = data;
        if (!id) return error(await t('Stripe payment requires an ID'));
        const order = await findStripeOrder({
          id,
          tenantId,
          client,
        });
        return {success: true, data: order};
      }
      case PaymentOption.paypal: {
        const {id} = data;
        if (!id) return error(await t('PayPal payment requires an ID'));
        const order = await findPaypalOrder({id, tenantId, client});

        return {success: true, data: order};
      }
      case PaymentOption.paybox: {
        const {params} = data;
        if (!params) {
          return error(await t('Paybox payment requires parameters'));
        }
        const order = await findPayboxOrder({params, client});
        return {success: true, data: order};
      }
      default:
        return error(await t('Invalid payment mode'));
    }
  } catch (e) {
    return error(await t(e instanceof Error ? e.message : 'Invalid payment'));
  }
};
