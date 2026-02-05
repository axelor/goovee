import PayPalHttpClient from '.';
import paypal from '@paypal/checkout-server-sdk';
import {DEFAULT_CURRENCY_CODE} from '@/constants';
import {manager, type Tenant} from '@/tenant';
import {PaymentOption} from '@/types';
import {createPaymentContext, findPaymentContext} from '../common/orm';
import type {PaymentOrder} from '../common/type';

export async function createPaypalOrder({
  amount,
  email,
  currency = DEFAULT_CURRENCY_CODE,
  context,
  tenantId,
}: {
  amount: string | number;
  email: string;
  currency: string;
  context: any;
  tenantId: Tenant['id'];
}) {
  if (!(amount && currency && email)) {
    throw new Error('Amount, currency and email is required');
  }

  const PaypalClient = PayPalHttpClient();

  const request = new paypal.orders.OrdersCreateRequest();

  request.headers['Prefer'] = 'return=representation';

  const client = await manager.getClient(tenantId);
  const {id: contextId} = await createPaymentContext({
    context,
    mode: PaymentOption.paypal,
    payer: email,
    client,
  });

  request.requestBody({
    intent: 'CAPTURE',
    payer: {
      email_address: email,
    } as any,
    purchase_units: [
      {
        custom_id: contextId,
        amount: {
          currency_code: currency,
          value: amount + '',
        },
      },
    ],
  });

  let response;
  try {
    response = await PaypalClient.execute(request);
  } catch (err) {
    throw new Error('Error processing payment. Try again');
  }

  if (response?.statusCode !== 201) {
    throw new Error('Error processing payment. Try again');
  }

  return response;
}

export async function findPaypalOrder({
  id,
  tenantId,
}: {
  id: string;
  tenantId: Tenant['id'];
}): Promise<PaymentOrder> {
  if (!id) {
    throw new Error('Order id is required');
  }

  const PaypalClient = PayPalHttpClient();

  const request = new paypal.orders.OrdersCaptureRequest(id);

  let response;
  try {
    response = await PaypalClient.execute(request);
  } catch (err) {
    throw new Error('Cannot capture payment');
  }

  if (!response) {
    throw new Error('Cannot capture payment');
  }

  const customId =
    response.result?.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;

  if (!customId) {
    throw new Error('Custom id not found');
  }

  const client = await manager.getClient(tenantId);
  const context = await findPaymentContext({
    id: customId,
    client,
    mode: PaymentOption.paypal,
  });

  if (!context) {
    throw new Error('Context not found');
  }

  return {
    context,
    amount: Number(
      response.result.purchase_units?.[0]?.payments?.captures?.[0]?.amount
        ?.value || 0,
    ),
  };
}
