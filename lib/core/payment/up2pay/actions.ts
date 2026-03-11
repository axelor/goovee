import {DEFAULT_CURRENCY_CODE} from '@/constants';
import type {Tenant} from '@/tenant';
import {PaymentOption} from '@/types';
import {getPaymentURL} from '.';
import {
  createPaymentContext,
  findPaymentContext,
  markPaymentAsCancelled,
} from '../common/orm';
import {UP2PAY_ERRORS} from './constants';
import {readPEMFile, verifySignature} from './crypto';
import {getParamsWithoutSign} from './utils';
import type {PaymentOrder} from '../common/type';

export async function createUp2payOrder({
  amount,
  email,
  name,
  currency = DEFAULT_CURRENCY_CODE,
  reference,
  context,
  url,
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
    tenantId,
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
  });

  return {
    url: paymentUrl,
  };
}
