import {DEFAULT_CURRENCY_CODE} from '@/constants';
import {manager, type Tenant} from '@/tenant';
import {PaymentOption} from '@/types';
import {decodeFilter as decode} from '@/utils/url';
import {getPaymentURL} from '.';
import {createPaymentContext, findPaymentContext} from '../common/orm';
import {PAYBOX_ERRORS} from './constant';
import {readPEMFile, verifySignature} from './crypto';
import {getParamsWithoutSign} from './utils';
import type {PaymentOrder} from '../common/type';

export async function createPayboxOrder({
  amount,
  email,
  currency = DEFAULT_CURRENCY_CODE,
  context,
  url,
  tenantId,
}: {
  amount: string | number;
  email: string;
  currency: string;
  context: any;
  url: {
    success: string;
    failure: string;
  };
  tenantId: Tenant['id'];
}) {
  if (!(amount && currency && email)) {
    throw new Error('Amount, currency and email is required');
  }

  const client = await manager.getClient(tenantId);
  const {id: contextId} = await createPaymentContext({
    context,
    mode: PaymentOption.paybox,
    payer: email,
    client,
  });

  return {
    url: getPaymentURL({
      amount,
      email,
      contextId,
      currency,
      url,
    }),
  };
}

export async function findPayboxOrder({
  params,
  tenantId,
}: {
  params: any;
  tenantId: Tenant['id'];
}): Promise<PaymentOrder> {
  if (!params) {
    throw new Error('Cannot find paybox order');
  }

  const message = getParamsWithoutSign(params);

  const pem = readPEMFile();

  const sign = params.sign;

  const error = params.error;

  if (!(pem && message && sign)) {
    throw new Error('Bad request');
  }

  if (!verifySignature(message, sign, pem)) {
    throw new Error('Bad request');
  }

  if (error !== PAYBOX_ERRORS.CODE_ERROR_OPERATION_SUCCESSFUL) {
    throw new Error('Bad request');
  }

  const reference: any = decode(params.reference);

  if (!reference?.context_id) {
    throw new Error('Context id not found');
  }

  const client = await manager.getClient(tenantId);
  const context = await findPaymentContext({
    id: reference.context_id,
    client,
    mode: PaymentOption.paybox,
  });

  if (!context) {
    throw new Error('Context not found');
  }

  return {
    context,
    amount: reference.amount,
  };
}
