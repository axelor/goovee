import {
  OrdersController,
  CheckoutPaymentIntent,
  ApiError,
} from '@paypal/paypal-server-sdk';
import PayPalClient from '.';
import {DEFAULT_CURRENCY_CODE} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {PaymentOption} from '@/types';
import {
  createPaymentContext,
  findPaymentContext,
  recordProviderTransactionRef,
} from '../common/orm';
import type {PaymentOrder} from '../common/type';

export async function createPaypalOrder({
  amount,
  email,
  currency = DEFAULT_CURRENCY_CODE,
  context,
  client,
}: {
  amount: string | number;
  email: string;
  currency: string;
  context: any;
  client: Client;
}) {
  if (!(amount && currency && email)) {
    throw new Error('Amount, currency and email is required');
  }

  const ordersController = new OrdersController(PayPalClient());

  const {id: contextId} = await createPaymentContext({
    context,
    mode: PaymentOption.paypal,
    payer: email,
    client,
  });

  let result;
  try {
    const response = await ordersController.createOrder({
      body: {
        intent: CheckoutPaymentIntent.Capture,
        payer: {
          emailAddress: email,
        },
        purchaseUnits: [
          {
            customId: contextId,
            amount: {
              currencyCode: currency,
              value: amount + '',
            },
          },
        ],
      },
      prefer: 'return=representation',
    });
    result = response.result;
  } catch (err) {
    if (err instanceof ApiError) {
      console.error('PayPal create order error:', err.result);
    }
    throw new Error('Error processing payment. Try again');
  }

  if (!result?.id) {
    throw new Error('Error processing payment. Try again');
  }

  return {result};
}

export async function confirmPaypalOrder({
  id,
  client,
}: {
  id: string;
  client: Client;
}): Promise<PaymentOrder> {
  if (!id) {
    throw new Error('Order id is required');
  }

  const ordersController = new OrdersController(PayPalClient());

  let result;
  try {
    const response = await ordersController.captureOrder({
      id,
      prefer: 'return=representation',
    });
    result = response.result;
  } catch (err) {
    if (err instanceof ApiError) {
      console.error('PayPal capture order error:', err.result);
    }
    throw new Error('Cannot capture payment');
  }

  if (!result) {
    throw new Error('Cannot capture payment');
  }

  const customId =
    result?.purchaseUnits?.[0]?.payments?.captures?.[0]?.customId;

  if (!customId) {
    throw new Error('Custom id not found');
  }

  const context = await findPaymentContext({
    id: customId,
    client,
    mode: PaymentOption.paypal,
  });

  if (!context) {
    throw new Error('Context not found');
  }

  const reference = result.purchaseUnits?.[0]?.payments?.captures?.[0]?.id;

  await recordProviderTransactionRef({
    context,
    client,
    providerTransactionRef: reference,
  });

  return {
    context,
    amount: Number(
      result.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount?.value || 0,
    ),
    reference,
  };
}
