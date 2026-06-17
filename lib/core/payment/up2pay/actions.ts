import {DEFAULT_CURRENCY_CODE} from '@/constants';
import {manager, type Tenant} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import {PaymentOption} from '@/types';
import {getPaymentURL} from '.';
import {createPaymentContext} from '../common/orm';

export async function createUp2payOrder({
  amount,
  email,
  name,
  currency = DEFAULT_CURRENCY_CODE,
  reference,
  context,
  url,
  client,
  tenantId,
  billingInfo,
}: {
  amount: string | number;
  email: string;
  name: string;
  currency: string;
  reference: string;
  context: any;
  url: {
    success: string;
    failure: string;
    cancel: string;
  };
  client: Client;
  tenantId: Tenant['id'];
  billingInfo?: {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    zipCode?: string;
    city?: string;
    countryCode?: string;
  };
}) {
  if (!(amount && currency && email)) {
    throw new Error('Amount, currency and email is required');
  }

  const paymentContext = await createPaymentContext({
    context,
    mode: PaymentOption.up2pay,
    payer: email,
    client,
  });

  const paymentUrl = getPaymentURL({
    amount,
    email,
    contextId: paymentContext.id,
    tenantId,
    name,
    reference,
    currency,
    url,
    billingInfo,
    config: await manager.getConfig(tenantId),
  });

  return {
    url: paymentUrl,
    contextId: paymentContext.id,
  };
}
