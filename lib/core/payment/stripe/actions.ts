import Stripe from 'stripe';

import {stripe} from '.';
import {DEFAULT_CURRENCY_CODE} from '@/constants';
import {formatAmountForStripe, getAmountFromStripe} from '@/utils/stripe';
import {
  findPaymentContext,
  createPaymentContext,
  updatePaymentContextData,
  markPaymentAsFailed,
} from '@/lib/core/payment/common/orm';
import {PaymentOption} from '@/types';
import type {Tenant} from '@/tenant';
import {
  type PaymentContextData,
  type PaymentOrder,
} from '@/lib/core/payment/common/type';
import {getBankDetailsFromInstructions, getBankTransferConfig} from './utils';
import type {CountryCode} from './utils';

async function getOrCreateStripeCustomer(
  email: string,
  internalUserId: string,
) {
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customerId = existingCustomers.data[0].id;
    return customerId;
  }

  const newCustomer = await stripe.customers.create({
    email: email,
    metadata: {external_id: internalUserId},
  });

  return newCustomer.id;
}

export async function createStripeOrder({
  customer,
  currency = DEFAULT_CURRENCY_CODE,
  name,
  amount,
  url,
  context,
  tenantId,
}: {
  tenantId: Tenant['id'];
  customer: {email: string; id: string};
  currency: string;
  name: string;
  amount: number;
  url: {
    success: string;
    error: string;
  };
  context: Record<string, any>;
}) {
  if (
    !(
      tenantId &&
      name &&
      amount &&
      customer?.email &&
      currency &&
      url?.success &&
      url?.error
    )
  ) {
    throw new Error(
      'Name, amount, customer, currency and callback urls are required',
    );
  }

  try {
    const {id: contextId} = await createPaymentContext({
      context,
      mode: PaymentOption.stripe,
      payer: customer.email,
      tenantId,
    });

    const session: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        mode: 'payment',
        submit_type: 'pay',
        client_reference_id: customer?.id,
        customer_email: customer?.email,
        metadata: {context_id: contextId},
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              product_data: {name},
              unit_amount: formatAmountForStripe(amount, currency),
            },
          },
        ],
        success_url: url.success,
        cancel_url: url.error,
      });

    return session;
  } catch (err) {
    throw new Error('Error processing payment. Try again.');
  }
}

export async function findStripeOrder({
  id,
  tenantId,
}: {
  id: string;
  tenantId: Tenant['id'];
}): Promise<PaymentOrder> {
  if (!id) {
    throw new Error('Session id is required');
  }

  let stripeSession;

  try {
    stripeSession = await stripe.checkout.sessions.retrieve(id);
  } catch (err) {
    throw new Error('Error retrieving payment');
  }

  if (!stripeSession) {
    throw new Error('Payment not found');
  }

  const contextId = stripeSession.metadata?.context_id;
  if (!contextId) {
    throw new Error('Context id not found');
  }

  const context = await findPaymentContext({
    id: contextId,
    tenantId,
    mode: PaymentOption.stripe,
  });

  if (!context) {
    throw new Error('Context not found');
  }

  if (
    !(
      (stripeSession.status as string) === 'complete' &&
      stripeSession.payment_status === 'paid'
    )
  ) {
    throw new Error('Payment not successfull');
  }

  let lineItems;
  try {
    lineItems = await stripe.checkout.sessions.listLineItems(id);
  } catch (err) {
    throw new Error('Error retrieving payment details');
  }

  if (!lineItems) {
    throw new Error('Payment details not found');
  }

  const currency = lineItems.data?.[0]?.currency || DEFAULT_CURRENCY_CODE;
  return {
    context,
    amount: getAmountFromStripe(lineItems.data?.[0]?.amount_total, currency),
  };
}

export async function createStripePaymentIntent({
  customer,
  currency = DEFAULT_CURRENCY_CODE,
  amount,
  context,
  tenantId,
  countryCode,
}: {
  tenantId: Tenant['id'];
  customer: {email: string; id: string};
  currency: string;
  amount: number;
  context: PaymentContextData;
  countryCode: CountryCode;
}) {
  if (!(tenantId && amount && customer?.email && currency && countryCode)) {
    throw new Error(
      'Name, amount, customer, currency and Country code are required',
    );
  }

  try {
    const bankTransfer = getBankTransferConfig(currency, countryCode);

    const paymentContext = await createPaymentContext({
      context,
      mode: PaymentOption.stripe,
      payer: customer.email,
      tenantId,
    });

    const stripeCustomerId = await getOrCreateStripeCustomer(
      customer.email,
      customer.id,
    );

    if (!stripeCustomerId) {
      throw new Error('Failed to create or retrieve Stripe customer');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount, currency),
      currency,
      customer: stripeCustomerId,
      // Payment method configuration
      payment_method_types: ['customer_balance'],
      payment_method_data: {type: 'customer_balance'},
      payment_method_options: {
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: bankTransfer,
        },
      },
      // Metadata for reference
      metadata: {
        context_id: paymentContext.id,
        tenant_id: tenantId,
      },
    });

    const confirmedIntent = await stripe.paymentIntents.confirm(
      paymentIntent.id,
    );
    if (!confirmedIntent?.id) {
      await markPaymentAsFailed({
        contextId: paymentContext.id,
        version: paymentContext.version,
        tenantId,
      });

      return;
    }

    // Attach PaymentIntent to the payment context
    await updatePaymentContextData({
      id: paymentContext.id,
      version: paymentContext.version,
      tenantId,
      context: {
        ...context,
        paymentIntent: confirmedIntent.id,
      },
    });

    // Extract bank details from the confirmed intent
    let bankDetails = null;
    let paymentReference = confirmedIntent.id;

    if (
      confirmedIntent.next_action?.type === 'display_bank_transfer_instructions'
    ) {
      const instructions =
        confirmedIntent.next_action.display_bank_transfer_instructions;

      paymentReference = instructions?.reference || confirmedIntent.id;
      bankDetails = getBankDetailsFromInstructions(instructions);
    }

    return {
      id: confirmedIntent.id,
      amount: confirmedIntent.amount,
      currency: confirmedIntent.currency,
      reference: paymentReference,
      bankDetails,
    };
  } catch (error) {
    console.error('Error creating stripe payment intent:', error);

    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(error.raw?.message || error.message);
    }

    throw new Error('Failed to create stripe payment intent');
  }
}

export async function findStripePaymentIntent(paymentIntentId: string) {
  if (!paymentIntentId) {
    throw new Error('Payment Intent id is required');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return paymentIntent;
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error retrieving payment intent');
  }
}
