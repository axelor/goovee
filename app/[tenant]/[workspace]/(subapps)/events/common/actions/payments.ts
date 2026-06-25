'use server';

import {z} from 'zod';
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
import {TENANT_HEADER} from '@/proxy';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessMessage} from '@/lib/core/access/denial';
import {getWorkspaceConfig} from '@/orm/workspace';
import {scale} from '@/utils';
import {withBasePath} from '@/lib/core/path/base-path';
import {ensureLeadingSlash} from '@/utils/url';

// ---- LOCAL IMPORTS ---- //
import {findEvent} from '@/subapps/events/common/orm/event';
import {error} from '@/subapps/events/common/utils';
import {getCalculatedTotalPrice} from '@/subapps/events/common/utils/payments';
import {validateRegistration} from '@/subapps/events/common/actions/validation';
import {
  CreateStripeCheckoutSessionSchema,
  PayboxCreateOrderSchema,
  PaypalCreateOrderSchema,
  type RegistrationValues,
} from './validators';

export async function createStripeCheckoutSession(props: {
  eventId: string;
  workspaceURL: string;
  values: RegistrationValues;
}) {
  const parsed = CreateStripeCheckoutSessionSchema.safeParse(props);
  if (!parsed.success) return error(z.prettifyError(parsed.error));
  const {eventId, workspaceURL, values} = parsed.data;
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return error(await t('TenantId is required'));

  const access = await ensureAuth({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return error(await t('Invalid workspace'));
  const workspace = {...access.workspace, config: workspaceConfig};

  const validationRes = await validateRegistration({
    eventId,
    values,
    workspaceURL,
    config: workspaceConfig,
    user,
    client,
  });

  if (validationRes.error) {
    return validationRes;
  }

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
    id: eventId,
    client,
    config,
    workspaceURL,
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
    const payer = await findGooveeUserByEmail(user.email, client);
    emailAddress = payer?.emailAddress?.address;
    payerId = payer?.id!;
  } else {
    emailAddress = values.emailAddress;
    payerId = values.emailAddress;
  }

  if (!emailAddress) {
    return {
      error: true,
      message: await t('Email is required for payment'),
    };
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
      client,
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
      message: await t(err instanceof Error ? err.message : String(err)),
    };
  }
}

export async function paypalCreateOrder(props: {
  values: RegistrationValues;
  workspaceURL: string;
  eventId: string;
}) {
  const parsed = PaypalCreateOrderSchema.safeParse(props);
  if (!parsed.success) return error(z.prettifyError(parsed.error));
  const {values, workspaceURL, eventId} = parsed.data;
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return error(await t('TenantId is required'));

  const access = await ensureAuth({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return error(await t('Invalid workspace'));
  const workspace = {...access.workspace, config: workspaceConfig};

  const validationRes = await validateRegistration({
    eventId,
    values,
    workspaceURL,
    config: workspaceConfig,
    user,
    client,
  });

  if (validationRes.error) {
    return validationRes;
  }

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
    id: eventId,
    client,
    config,
    workspaceURL,
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
    const payer = await findGooveeUserByEmail(user.email, client);
    emailAddress = payer?.emailAddress?.address;
  } else {
    emailAddress = values.emailAddress;
  }

  if (!emailAddress) {
    return {
      error: true,
      message: await t('Email is required for payment'),
    };
  }

  const currencyCode = currency?.code || DEFAULT_CURRENCY_CODE;
  try {
    const response = await createPaypalOrder({
      amount: expectedAmount,
      currency: currencyCode,
      email: emailAddress,
      client,
      context: values,
    });
    return {success: true, order: response?.result};
  } catch (err) {
    return {
      error: true,
      message: await t(err instanceof Error ? err.message : String(err)),
    };
  }
}

export async function payboxCreateOrder(props: {
  eventId: string;
  workspaceURL: string;
  values: RegistrationValues;
  uri: string;
}) {
  const parsed = PayboxCreateOrderSchema.safeParse(props);
  if (!parsed.success) return error(z.prettifyError(parsed.error));
  const {eventId, workspaceURL, values, uri} = parsed.data;
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return error(await t('TenantId is required'));

  const access = await ensureAuth({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return error(await t('Invalid workspace'));
  const workspace = {...access.workspace, config: workspaceConfig};

  const validationRes = await validateRegistration({
    eventId,
    values,
    workspaceURL,
    config: workspaceConfig,
    user,
    client,
  });
  if (validationRes.error) {
    return validationRes;
  }

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
    id: eventId,
    client,
    config,
    workspaceURL,
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
  if (user) {
    const payer = await findGooveeUserByEmail(user.email, client);
    emailAddress = payer?.emailAddress?.address;
  } else {
    emailAddress = values.emailAddress;
  }

  if (!emailAddress) {
    return {
      error: true,
      message: await t('Email is required for payment'),
    };
  }

  try {
    const response = await createPayboxOrder({
      amount: expectedAmount,
      currency: currencyCode,
      email: emailAddress,
      context: values,
      client,
      url: {
        success: `${process.env.GOOVEE_PUBLIC_HOST}${withBasePath(ensureLeadingSlash(`${uri}?paybox_response=true`))}`,
        failure: `${process.env.GOOVEE_PUBLIC_HOST}${withBasePath(ensureLeadingSlash(`${uri}?paybox_error=true`))}`,
      },
    });
    return {success: true, order: response};
  } catch (err) {
    console.error('An error occurred while creatinig paybox order:', err);
    return error(await t(err instanceof Error ? err.message : String(err)));
  }
}
