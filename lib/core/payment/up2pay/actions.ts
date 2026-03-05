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
import {decodeFilter as decode} from '@/utils/url';

export async function createUp2payOrder({
  amount,
  email,
  currency = DEFAULT_CURRENCY_CODE,
  context,
  url,
  tenantId,
  billingInfo,
}: {
  amount: string | number;
  email: string;
  currency: string;
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

  const {id: contextId} = await createPaymentContext({
    context,
    mode: PaymentOption.up2pay,
    payer: email,
    tenantId,
  });

  const paymentUrl = getPaymentURL({
    amount,
    email,
    contextId,
    tenantId,
    currency,
    url,
    billingInfo,
  });

  return {
    url: paymentUrl,
  };
}

export async function findUp2payOrder({
  params,
  tenantId,
}: {
  params: any;
  tenantId: Tenant['id'];
}): Promise<PaymentOrder> {
  if (!params) {
    throw new Error('Cannot find up2pay order');
  }

  const message = getParamsWithoutSign(params);

  const pem = readPEMFile();
  const sign = params.sign;
  const erreur = params.erreur;
  const ref = params.ref;
  const montant = params.montant;

  if (!(pem && message && sign)) {
    throw new Error('Bad request');
  }

  const isSignatureValid = verifySignature(message, sign, pem);

  if (!isSignatureValid) {
    throw new Error('Bad request');
  }

  const reference: any = decode(ref);
  if (!reference?.context_id) {
    throw new Error('Context id not found');
  }

  const contextId = reference.context_id;
  const context = await findPaymentContext({
    id: contextId,
    tenantId,
    mode: PaymentOption.up2pay,
  });
  if (!context) {
    throw new Error('Context not found');
  }

  if (erreur !== UP2PAY_ERRORS.CODE_ERROR_OPERATION_SUCCESSFUL) {
    console.error('[UP2PAY][VERIFY] Payment failed or cancelled', {erreur});
    await markPaymentAsCancelled({
      contextId: context.id,
      version: context.version,
      tenantId,
    });
    return {
      context,
      amount: 0,
      cancelled: true,
    };
  }

  const finalAmount = montant ? Number(montant) / 100 : context.data?.amount;

  return {
    context,
    amount: finalAmount,
  };
}
