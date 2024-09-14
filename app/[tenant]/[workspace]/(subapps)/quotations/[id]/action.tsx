'use server';

import {headers} from 'next/headers';
import paypal from '@paypal/checkout-server-sdk';
import type {Stripe} from 'stripe';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/lib/i18n';
import {getSession} from '@/orm/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {
  DEFAULT_CURRENCY_CODE,
  DEFAULT_CURRENCY_SCALE,
  SUBAPP_CODES,
} from '@/constants';
import paypalhttpclient from '@/payment/paypal';
import {stripe} from '@/payment/stripe';
import {PaymentOption} from '@/types';
import {findPartnerByEmail} from '@/orm/partner';
import {formatAmountForStripe} from '@/utils/stripe';
import {scale} from '@/utils';
import {TENANT_HEADER} from '@/middleware';

// ---- LOCAL IMPORTS ---- //
import {getWhereClause} from '@/subapps/quotations/common/utils/quotations';
import {findQuotation} from '@/subapps/quotations/common/orm/quotations';

export async function confirmQuotation({
  workspaceURL,
  quotationId,
}: {
  workspaceURL: string;
  quotationId: string;
}) {
  const tenantId = headers().get(TENANT_HEADER);

  if (!(workspaceURL && quotationId && tenantId)) {
    return {
      error: true,
      message: i18n.get('Bad request'),
    };
  }

  const session = await getSession();

  const user = session?.user;

  if (!user) {
    return {
      error: true,
      message: i18n.get('Unauthorized'),
    };
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.quotations,
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!subapp) {
    return {
      error: true,
      message: i18n.get('Unauthorized'),
    };
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return {
      error: true,
      message: i18n.get('Invalid workspace'),
    };
  }

  const {isContact, id, mainPartnerId} = session?.user;

  const {role} = subapp;

  const where = getWhereClause(isContact, role, id, mainPartnerId);

  const quotation = await findQuotation({
    id: quotationId,
    tenantId,
    params: {where},
  });

  if (!quotation) {
    return {
      error: true,
      message: i18n.get('Unauthorized'),
    };
  }

  /**
   * TODO
   *
   * Convert to order
   */

  return {
    success: true,
    order: {id: quotationId},
  };
}

export async function paypalCaptureOrder({
  orderId,
  quotation,
  workspaceURL,
}: {
  orderId: string;
  quotation: any;
  workspaceURL: string;
}) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: 'Unauthorized',
    };
  }

  const tenantId = headers().get(TENANT_HEADER);

  if (!(orderId && workspaceURL && quotation && tenantId)) {
    return {
      error: true,
      message: 'Bad request',
    };
  }

  const user = session?.user;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return {
      error: true,
      message: 'Invalid workspace',
    };
  }

  const hasQuotationAccess = await findSubappAccess({
    code: SUBAPP_CODES.quotations,
    user,
    url: workspace.url,
    tenantId,
  });

  if (!hasQuotationAccess) {
    return {
      error: true,
      message: 'Unauthorized',
    };
  }

  if (!workspace?.config?.payQuotationToConfirm) {
    return {
      error: true,
      message: i18n.get('Not allowed'),
    };
  }

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return {
      error: true,
      message: i18n.get('Online payment is not available'),
    };
  }

  const allowPaypal = workspace?.config?.paymentOptionSet?.find(
    (o: any) => o?.typeSelect === PaymentOption.paypal,
  );

  if (!allowPaypal) {
    return {
      error: true,
      message: i18n.get('Paypal is not available'),
    };
  }

  const PaypalClient = paypalhttpclient();

  const request = new paypal.orders.OrdersCaptureRequest(orderId);

  const response = await PaypalClient.execute(request);

  if (!response) {
    return {
      error: true,
      message: 'Error processing payment. Try again.',
    };
  }

  const {result} = response;

  const purchase = result?.purchase_units?.[0];

  if (
    Number(purchase?.payments?.captures?.[0]?.amount?.value) !==
    Number(
      scale(
        Number(quotation?.inTaxTotal),
        quotation?.currency.numberOfDecimals || DEFAULT_CURRENCY_SCALE,
      ),
    )
  ) {
    return {
      error: true,
      message: 'Amount mismatched',
    };
  }

  /**
   * TODO
   *
   * Convert to order
   */

  return {
    success: true,
    order: quotation,
  };
}

export async function paypalCreateOrder({
  quotation,
  workspaceURL,
}: {
  quotation: any;
  workspaceURL: string;
}) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: i18n.get('Unauthorized'),
    };
  }

  if (!quotation) {
    return {
      error: true,
      message: i18n.get('Bad request'),
    };
  }

  const tenantId = headers().get(TENANT_HEADER);

  if (!(workspaceURL && tenantId)) {
    return {
      error: true,
      message: i18n.get('Bad request'),
    };
  }

  const user = session?.user;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return {
      error: true,
      message: i18n.get('Invalid workspace'),
    };
  }

  const hasQuotationAccess = await findSubappAccess({
    code: SUBAPP_CODES.quotations,
    user,
    url: workspace.url,
    tenantId,
  });

  if (!hasQuotationAccess) {
    return {
      error: true,
      message: i18n.get('Unauthorized'),
    };
  }

  if (!workspace?.config?.payQuotationToConfirm) {
    return {
      error: true,
      message: i18n.get('Not allowed'),
    };
  }

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return {
      error: true,
      message: i18n.get('Online payment is not available'),
    };
  }

  const allowPaypal = workspace?.config?.paymentOptionSet?.find(
    (o: any) => o?.typeSelect === PaymentOption.paypal,
  );

  if (!allowPaypal) {
    return {
      error: true,
      message: i18n.get('Paypal is not available'),
    };
  }

  const payer = await findPartnerByEmail(user?.email, tenantId);

  const PaypalClient = paypalhttpclient();

  const request = new paypal.orders.OrdersCreateRequest();

  request.headers['Prefer'] = 'return=representation';

  request.requestBody({
    intent: 'CAPTURE',
    payer: {
      email_address: payer?.emailAddress?.address,
    } as any,
    purchase_units: [
      {
        amount: {
          currency_code: quotation?.currency?.code || DEFAULT_CURRENCY_CODE,
          value:
            scale(
              Number(quotation?.inTaxTotal),
              quotation?.currency.numberOfDecimals || DEFAULT_CURRENCY_SCALE,
            ) + '',
        },
      },
    ],
  });

  try {
    const response = await PaypalClient.execute(request);
    if (response.statusCode !== 201) {
      return {
        error: true,
        message: i18n.get('Error processing payment. Try again'),
      };
    }

    return {success: true, order: response?.result};
  } catch (err) {
    return {
      error: true,
      message: i18n.get('Error processing payment. Try again'),
    };
  }
}

export async function createStripeCheckoutSession({
  quotation,
  workspaceURL,
}: {
  quotation: any;
  workspaceURL: string;
}) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: i18n.get('Unauthorized'),
    };
  }

  const tenantId = headers().get(TENANT_HEADER);

  if (!(quotation && workspaceURL && tenantId)) {
    return {
      error: true,
      message: i18n.get('Bad request'),
    };
  }

  const user = session?.user;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return {
      error: true,
      message: i18n.get('Invalid workspace'),
    };
  }

  const hasQuotationAccess = await findSubappAccess({
    code: SUBAPP_CODES.quotations,
    user,
    url: workspace.url,
    tenantId,
  });

  if (!hasQuotationAccess) {
    return {
      error: true,
      message: i18n.get('Unauthorized'),
    };
  }

  if (!workspace?.config?.payQuotationToConfirm) {
    return {
      error: true,
      message: i18n.get('Not allowed'),
    };
  }

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return {
      error: true,
      message: i18n.get('Online payment is not available'),
    };
  }

  const allowStripe = workspace?.config?.paymentOptionSet?.find(
    (o: any) => o?.typeSelect === PaymentOption.stripe,
  );

  if (!allowStripe) {
    return {
      error: true,
      message: i18n.get('Stripe is not available'),
    };
  }

  const payer = await findPartnerByEmail(user.email, tenantId);

  const currencyCode = quotation?.currency?.code || DEFAULT_CURRENCY_CODE;

  const checkoutSession: Stripe.Checkout.Session =
    await stripe.checkout.sessions.create({
      mode: 'payment',
      submit_type: 'pay',
      client_reference_id: payer?.id,
      customer_email: payer?.emailAddress?.address,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currencyCode,
            product_data: {
              name: 'Cart Checkout',
            },
            unit_amount: formatAmountForStripe(
              Number(quotation.inTaxTotal || 0),
              currencyCode,
            ),
          },
        },
      ],
      success_url: `${workspaceURL}/${SUBAPP_CODES.quotations}/${quotation.id}?stripe_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${workspaceURL}/${SUBAPP_CODES.quotations}/${quotation.id}?stripe_error=true`,
    });

  return {
    client_secret: checkoutSession.client_secret,
    url: checkoutSession.url,
  };
}

export async function validateStripePayment({
  stripeSessionId,
  quotation,
  workspaceURL,
}: {
  stripeSessionId: string;
  quotation: any;
  workspaceURL: string;
}) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: i18n.get('Unauthorized'),
    };
  }

  const tenantId = headers().get(TENANT_HEADER);

  if (!(quotation && workspaceURL && tenantId)) {
    return {
      error: true,
      message: i18n.get('Bad request'),
    };
  }

  const user = session?.user;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return {
      error: true,
      message: i18n.get('Invalid workspace'),
    };
  }

  const hasQuotationAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    tenantId,
  });

  if (!hasQuotationAccess) {
    return {
      error: true,
      message: i18n.get('Unauthorized'),
    };
  }

  if (!workspace?.config?.payQuotationToConfirm) {
    return {
      error: true,
      message: i18n.get('Not allowed'),
    };
  }

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return {
      error: true,
      message: i18n.get('Online payment is not available'),
    };
  }

  const allowStripe = workspace?.config?.paymentOptionSet?.find(
    (o: any) => o?.typeSelect === PaymentOption.stripe,
  );

  if (!allowStripe) {
    return {
      error: true,
      message: i18n.get('Stripe is not available'),
    };
  }

  if (!stripeSessionId) {
    return {
      error: true,
      message: i18n.get('Bad Request'),
    };
  }

  const stripeSession =
    await stripe.checkout.sessions.retrieve(stripeSessionId);

  if (!stripeSession) {
    return {
      error: true,
      message: i18n.get('Invalid stripe session'),
    };
  }

  if (
    !(
      (stripeSession.status as string) === 'complete' &&
      stripeSession.payment_status === 'paid'
    )
  ) {
    return {
      error: true,
      message: i18n.get('Payment not successfull'),
    };
  }

  const lineItems =
    await stripe.checkout.sessions.listLineItems(stripeSessionId);

  if (!lineItems) {
    return {
      error: true,
      message: i18n.get('Payment not successfull'),
    };
  }

  const currencyCode = quotation?.currency?.code || DEFAULT_CURRENCY_CODE;

  const stripeTotal = lineItems?.data?.[0]?.amount_total;
  const cartTotal = formatAmountForStripe(
    Number(quotation?.inTaxTotal || 0),
    currencyCode,
  );

  if (stripeTotal && cartTotal && stripeTotal !== cartTotal) {
    return {
      error: true,
      message: i18n.get('Payment amount mistmatch'),
    };
  }

  /**
   * TODO
   *
   * Convert to order
   */

  return {
    success: true,
    order: quotation,
  };
}
