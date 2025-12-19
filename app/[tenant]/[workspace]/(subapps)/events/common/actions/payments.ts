'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {DEFAULT_CURRENCY_CODE, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {findGooveeUserByEmail} from '@/orm/partner';
import {createPaypalOrder} from '@/payment/paypal/actions';
import {createStripeOrder} from '@/payment/stripe/actions';
import {createPayboxOrder} from '@/payment/paybox/actions';
import {PaymentOption} from '@/types';
import {isPaymentOptionAvailable} from '@/utils/payment';
import {TENANT_HEADER} from '@/middleware';
import {scale} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {findEvent} from '@/subapps/events/common/orm/event';
import {error} from '@/subapps/events/common/utils';
import {getCalculatedTotalPrice} from '@/subapps/events/common/utils/payments';
import {validateRegistration} from '@/subapps/events/common/actions/validation';

export async function createStripeCheckoutSession({
  event,
  workspaceURL,
  values,
}: {
  event: {
    id: string | number;
  };
  workspaceURL: string;
  values: any;
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return error(await t('TenantId is required'));
  const validationRes = await validateRegistration({
    eventId: event?.id?.toString(),
    values,
    workspaceURL,
    tenantId,
  });

  if (validationRes.error) {
    return validationRes;
  }
  const {workspace, user} = validationRes.data;

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return error(await t('Online payment is not available'));
  }

  const paymentOptionSet = workspace?.config?.paymentOptionSet;
  if (!paymentOptionSet?.length) {
    return error(await t('Payment options are not configured'));
  }

  const allowStripe = isPaymentOptionAvailable(
    paymentOptionSet,
    PaymentOption.stripe,
  );
  if (!allowStripe) {
    return error(await t('Stripe is not available'));
  }

  const $event = await findEvent({
    id: event.id,
    tenantId,
    workspace,
  });

  if (!$event) {
    return error(await t('Invalid event'));
  }
  const currency = $event.currency;
  const currencyCode = currency?.code || DEFAULT_CURRENCY_CODE;

  const {total} = getCalculatedTotalPrice(values, $event);
  const expectedAmount = Number(scale(total, $event.priceScale));

  if (!expectedAmount || expectedAmount <= 0) {
    return error(await t('Total price must be greater than 0'));
  }

  let emailAddress;
  let payerId;
  if (user) {
    const payer = await findGooveeUserByEmail(user.email, tenantId);
    emailAddress = payer?.emailAddress?.address!;
    payerId = payer?.id!;
  } else {
    emailAddress = values.emailAddress;
    payerId = values.emailAddress;
  }

  try {
    const session = await createStripeOrder({
      customer: {
        id: payerId,
        email: emailAddress,
      },
      name: await t('Event Registration'),
      amount: expectedAmount,
      currency: currencyCode,
      context: values,
      tenantId,
      url: {
        success: `${workspaceURL}/${SUBAPP_CODES.events}/${$event.slug}/register?stripe_session_id={CHECKOUT_SESSION_ID}`,
        error: `${workspaceURL}/${SUBAPP_CODES.events}/${$event.slug}/register?stripe_error=true`,
      },
    });

    return {
      client_secret: session.client_secret,
      url: session.url,
    };
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    return {
      error: true,
      message: await t((err as any)?.message),
    };
  }
}

export async function paypalCreateOrder({
  values,
  workspaceURL,
  event,
}: {
  values: any;
  workspaceURL: string;
  event: {
    id: string | number;
  };
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return error(await t('TenantId is required'));

  const validationRes = await validateRegistration({
    eventId: event?.id?.toString(),
    values,
    workspaceURL,
    tenantId,
  });

  if (validationRes.error) {
    return validationRes;
  }
  const {workspace, user} = validationRes.data;

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return error(await t('Online payment is not available'));
  }

  const paymentOptionSet = workspace?.config?.paymentOptionSet;
  if (!paymentOptionSet?.length) {
    return error(await t('Payment options are not configured.'));
  }

  const allowPaypal = isPaymentOptionAvailable(
    paymentOptionSet,
    PaymentOption.paypal,
  );

  if (!allowPaypal) {
    return error(await t('Paypal is not available'));
  }

  const $event = await findEvent({
    id: event.id,
    tenantId,
    workspace,
  });

  if (!$event) {
    return error(await t('Invalid event'));
  }

  const {total} = getCalculatedTotalPrice(values, $event);
  const expectedAmount = Number(scale(total, $event.priceScale));

  if (!expectedAmount || expectedAmount <= 0) {
    return error(await t('Total price must be greater than 0.'));
  }

  const currency = $event.currency;

  let emailAddress;
  if (user) {
    const payer = await findGooveeUserByEmail(user.email, tenantId);
    emailAddress = payer?.emailAddress?.address!;
  } else {
    emailAddress = values.emailAddress;
  }
  const currencyCode = currency?.code || DEFAULT_CURRENCY_CODE;
  try {
    const response = await createPaypalOrder({
      amount: expectedAmount,
      currency: currencyCode,
      email: emailAddress,
      tenantId,
      context: values,
    });
    return {success: true, order: response?.result};
  } catch (err) {
    return {
      error: true,
      message: await t((err as any)?.message),
    };
  }
}

export async function payboxCreateOrder({
  event,
  workspaceURL,
  values,
  uri,
}: {
  event: {
    id: string | number;
  };
  workspaceURL: string;
  values: any;
  uri: string;
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return error(await t('TenantId is required'));

  const validationRes = await validateRegistration({
    eventId: event?.id?.toString(),
    values,
    workspaceURL,
    tenantId,
  });
  if (validationRes.error) {
    return validationRes;
  }
  const {workspace, user} = validationRes.data;

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return error(await t('Online payment is not available'));
  }

  const paymentOptionSet = workspace?.config?.paymentOptionSet;
  if (!paymentOptionSet?.length) {
    return error(await t('Payment options are not configured.'));
  }

  const allowPaybox = isPaymentOptionAvailable(
    paymentOptionSet,
    PaymentOption.paybox,
  );
  if (!allowPaybox) {
    return error(await t('Paybox is not available'));
  }

  const $event = await findEvent({
    id: event.id,
    tenantId,
    workspace,
  });

  if (!$event) {
    return error(await t('Invalid event'));
  }
  const currency = $event.currency;
  const currencyCode = currency?.code || DEFAULT_CURRENCY_CODE;

  const {total} = getCalculatedTotalPrice(values, $event);
  const expectedAmount = Number(scale(total, $event.priceScale));

  if (!expectedAmount || expectedAmount <= 0) {
    return error(await t('Total price must be greater than 0'));
  }

  let emailAddress;
  let payerId;
  if (user) {
    const payer = await findGooveeUserByEmail(user.email, tenantId);
    emailAddress = payer?.emailAddress?.address!;
    payerId = payer?.id!;
  } else {
    emailAddress = values.emailAddress;
    payerId = values.emailAddress;
  }
  try {
    const response = await createPayboxOrder({
      amount: expectedAmount,
      currency: currencyCode,
      email: emailAddress,
      context: values,
      tenantId,
      url: {
        success: `${process.env.GOOVEE_PUBLIC_HOST}/${uri}?paybox_response=true`,
        failure: `${process.env.GOOVEE_PUBLIC_HOST}/${uri}?paybox_error=true`,
      },
    });
    return {success: true, order: response};
  } catch (err) {
    console.error('An error occurred while creatinig paybox order:', err);
    return error(await t((err as any)?.message));
  }
}
