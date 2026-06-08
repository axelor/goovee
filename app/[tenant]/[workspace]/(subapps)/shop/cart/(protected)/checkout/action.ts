'use server';

import {z} from 'zod';
import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {DEFAULT_CURRENCY_CODE, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {createPayboxOrder, findPayboxOrder} from '@/payment/paybox/actions';
import {createPaypalOrder, findPaypalOrder} from '@/payment/paypal/actions';
import {createStripeOrder, findStripeOrder} from '@/payment/stripe/actions';
import {manager} from '@/tenant';
import {PaymentOption} from '@/types';
import {computeTotal} from '@/utils/cart';
import {getPaymentModeId, isPaymentOptionAvailable} from '@/utils/payment';
import {findGooveeUserByEmail} from '@/orm/partner';
import {shouldHidePricesAndPurchase} from '@/orm/product';
import {markPaymentAsProcessed} from '@/lib/core/payment/common/orm';
import {withBasePath} from '@/lib/core/path/base-path';
import {ensureLeadingSlash} from '@/utils/url';

// ---- LOCAL IMPORTS ---- //
import {
  computeExpectedAmount,
  formatNumber,
} from '@/subapps/shop/common/utils/order';
import {createOrder} from '@/subapps/shop/common/service';
import {
  CartOrderSchema,
  PayboxCreateOrderSchema,
  PaypalCaptureOrderSchema,
  ValidatePayboxPaymentSchema,
  ValidateStripePaymentSchema,
  type CartOrderInput,
  type PayboxCreateOrderInput,
  type PaypalCaptureOrderInput,
  type ValidatePayboxPaymentInput,
  type ValidateStripePaymentInput,
} from '@/subapps/shop/common/validators';

export async function paypalCaptureOrder({
  orderId,
  workspaceURL,
}: PaypalCaptureOrderInput) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const parsedPaypalCapture = PaypalCaptureOrderSchema.safeParse({
    orderId,
    workspaceURL,
  });
  if (!parsedPaypalCapture.success) {
    return {error: true, message: z.prettifyError(parsedPaypalCapture.error)};
  }

  const user = session?.user;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid tenant'),
    };
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const hasShopAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    client,
  });

  if (!hasShopAccess) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!workspace?.config?.confirmOrder) {
    return {
      error: true,
      message: await t('Not allowed'),
    };
  }

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return {
      error: true,
      message: await t('Online payment is not available'),
    };
  }

  const allowPaypal = isPaymentOptionAvailable(
    workspace?.config?.paymentOptionSet,
    PaymentOption.paypal,
  );

  if (!allowPaypal) {
    return {
      error: true,
      message: await t('Paypal is not available'),
    };
  }

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
    client,
  });

  if (hidePriceAndPurchase) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }
  try {
    const {amount, context} = await findPaypalOrder({
      id: orderId,
      client,
    });

    const cart = context.data;

    const {total} = computeTotal({
      cart,
      workspace,
      formatNumber,
    });

    const expectedAmount = computeExpectedAmount({total, workspace});

    if (Number(amount) !== Number(expectedAmount)) {
      return {
        error: true,
        message: await t('Amount mismatched'),
      };
    }

    const paymentModeId = getPaymentModeId(
      workspace?.config?.paymentOptionSet,
      PaymentOption.paypal,
    );

    try {
      const res = await createOrder({
        cart,
        workspace,
        user,
        client,
        config: tenant.config,
        paymentModeId,
      });
      await markPaymentAsProcessed({
        contextId: context.id,
        version: context.version,
        client,
      });
      return res;
    } catch (err) {
      return {
        error: true,
        message:
          err instanceof Error ? err.message : await t('Something went wrong'),
      };
    }
  } catch (err) {
    return {
      error: true,
      message:
        err instanceof Error ? err.message : await t('Something went wrong'),
    };
  }
}

export async function paypalCreateOrder({cart, workspaceURL}: CartOrderInput) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const parsedCartOrder = CartOrderSchema.safeParse({cart, workspaceURL});
  if (!parsedCartOrder.success) {
    return {error: true, message: z.prettifyError(parsedCartOrder.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid tenant'),
    };
  }

  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const hasShopAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    client,
  });

  if (!hasShopAccess) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!workspace?.config?.confirmOrder) {
    return {
      error: true,
      message: await t('Not allowed'),
    };
  }

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return {
      error: true,
      message: await t('Online payment is not available'),
    };
  }

  const allowPaypal = isPaymentOptionAvailable(
    workspace?.config?.paymentOptionSet,
    PaymentOption.paypal,
  );

  if (!allowPaypal) {
    return {
      error: true,
      message: await t('Paypal is not available'),
    };
  }

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
    client,
  });

  if (hidePriceAndPurchase) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }
  const {total, currency} = computeTotal({
    cart,
    workspace,
    formatNumber,
  });

  const expectedAmount = computeExpectedAmount({total, workspace});

  const payer = await findGooveeUserByEmail(user?.email, client);
  const payerEmail = payer?.emailAddress?.address;

  if (!payerEmail) {
    return {
      error: true,
      message: await t('Email is required for payment'),
    };
  }

  try {
    const response = await createPaypalOrder({
      client,
      context: cart,
      amount: expectedAmount,
      currency: currency?.code,
      email: payerEmail,
    });

    return {success: true, order: response?.result};
  } catch (err) {
    return {
      error: true,
      message:
        err instanceof Error ? err.message : await t('Something went wrong'),
    };
  }
}

export async function createStripeCheckoutSession({
  cart,
  workspaceURL,
}: CartOrderInput) {
  const session = await getSession();
  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const parsedCartOrder = CartOrderSchema.safeParse({cart, workspaceURL});
  if (!parsedCartOrder.success) {
    return {error: true, message: z.prettifyError(parsedCartOrder.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid tenant'),
    };
  }

  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const hasShopAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    client,
  });

  if (!hasShopAccess) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!workspace?.config?.confirmOrder) {
    return {
      error: true,
      message: await t('Not allowed'),
    };
  }

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return {
      error: true,
      message: await t('Online payment is not available'),
    };
  }

  const allowStripe = isPaymentOptionAvailable(
    workspace?.config?.paymentOptionSet,
    PaymentOption.stripe,
  );

  if (!allowStripe) {
    return {
      error: true,
      message: await t('Stripe is not available'),
    };
  }

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
    client,
  });

  if (hidePriceAndPurchase) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const {total, currency} = computeTotal({
    cart,
    workspace,
    formatNumber,
  });

  const expectedAmount = computeExpectedAmount({total, workspace});

  const payer = await findGooveeUserByEmail(user.email, client);
  const payerEmail = payer?.emailAddress?.address;

  if (!payerEmail) {
    return {
      error: true,
      message: await t('Email is required for payment'),
    };
  }

  const currencyCode = currency?.code || DEFAULT_CURRENCY_CODE;

  try {
    const session = await createStripeOrder({
      tenantId,
      client,
      customer: {
        id: payer?.id!,
        email: payerEmail,
      },
      name: 'Cart Checkout',
      amount: Number(expectedAmount),
      currency: currencyCode,
      context: cart,
      url: {
        success: `${workspaceURL}/${SUBAPP_CODES.shop}/cart/checkout?stripe_session_id={CHECKOUT_SESSION_ID}`,
        error: `${workspaceURL}/${SUBAPP_CODES.shop}/cart/checkout?stripe_error=true`,
      },
    });

    return {
      client_secret: session.client_secret,
      url: session.url,
    };
  } catch (err) {
    return {
      error: true,
      message:
        err instanceof Error ? err.message : await t('Something went wrong'),
    };
  }
}

export async function validateStripePayment({
  stripeSessionId,
  workspaceURL,
}: ValidateStripePaymentInput) {
  const session = await getSession();
  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const parsedStripeValidation = ValidateStripePaymentSchema.safeParse({
    stripeSessionId,
    workspaceURL,
  });
  if (!parsedStripeValidation.success) {
    return {
      error: true,
      message: z.prettifyError(parsedStripeValidation.error),
    };
  }

  const user = session?.user;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid tenant'),
    };
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const hasShopAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    client,
  });

  if (!hasShopAccess) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!workspace?.config?.confirmOrder) {
    return {
      error: true,
      message: await t('Not allowed'),
    };
  }

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return {
      error: true,
      message: await t('Online payment is not available'),
    };
  }

  const allowStripe = isPaymentOptionAvailable(
    workspace?.config?.paymentOptionSet,
    PaymentOption.stripe,
  );
  if (!allowStripe) {
    return {
      error: true,
      message: await t('Stripe is not available'),
    };
  }

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
    client,
  });

  if (hidePriceAndPurchase) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  let paidAmount, cart, context;
  try {
    const order = await findStripeOrder({
      id: stripeSessionId,
      client,
    });
    cart = order.context.data;
    paidAmount = order.amount;
    context = order.context;
  } catch (err) {
    return {
      error: true,
      message:
        err instanceof Error ? err.message : await t('Something went wrong'),
    };
  }

  const {total} = computeTotal({
    cart,
    workspace,
    formatNumber,
  });

  const expectedAmount = computeExpectedAmount({total, workspace});

  if (Number(paidAmount) !== Number(expectedAmount)) {
    return {
      error: true,
      message: await t('Payment amount mismatch'),
    };
  }

  const paymentModeId = getPaymentModeId(
    workspace?.config?.paymentOptionSet,
    PaymentOption.stripe,
  );

  try {
    const res = await createOrder({
      cart,
      workspace,
      user,
      client,
      config: tenant.config,
      paymentModeId,
    });
    await markPaymentAsProcessed({
      contextId: context.id,
      version: context.version,
      client,
    });
    return res;
  } catch (err) {
    return {
      error: true,
      message:
        err instanceof Error ? err.message : await t('Something went wrong'),
    };
  }
}

export async function payboxCreateOrder({
  cart,
  workspaceURL,
  uri,
}: PayboxCreateOrderInput) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const parsedPayboxCreate = PayboxCreateOrderSchema.safeParse({
    cart,
    workspaceURL,
    uri,
  });
  if (!parsedPayboxCreate.success) {
    return {error: true, message: z.prettifyError(parsedPayboxCreate.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid tenant'),
    };
  }

  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const hasShopAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    client,
  });

  if (!hasShopAccess) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!workspace?.config?.confirmOrder) {
    return {
      error: true,
      message: await t('Not allowed'),
    };
  }

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return {
      error: true,
      message: await t('Online payment is not available'),
    };
  }

  const allowPaybox = isPaymentOptionAvailable(
    workspace?.config?.paymentOptionSet,
    PaymentOption.paybox,
  );
  if (!allowPaybox) {
    return {
      error: true,
      message: await t('Paybox is not available'),
    };
  }

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
    client,
  });

  if (hidePriceAndPurchase) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }
  const {total, currency} = computeTotal({
    cart,
    workspace,
    formatNumber,
  });

  const expectedAmount = computeExpectedAmount({total, workspace});

  const payer = await findGooveeUserByEmail(user?.email, client);
  const payerEmail = payer?.emailAddress?.address;

  if (!payerEmail) {
    return {
      error: true,
      message: await t('Email is required for payment'),
    };
  }

  try {
    const response = await createPayboxOrder({
      client,
      amount: expectedAmount,
      currency: currency?.code,
      email: payerEmail,
      context: cart,
      url: {
        success: `${process.env.GOOVEE_PUBLIC_HOST}${withBasePath(ensureLeadingSlash(`${uri}?paybox_response=true`))}`,
        failure: `${process.env.GOOVEE_PUBLIC_HOST}${withBasePath(ensureLeadingSlash(`${uri}?paybox_error=true`))}`,
      },
    });

    return {success: true, order: response};
  } catch (err) {
    return {
      error: true,
      message:
        err instanceof Error ? err.message : await t('Something went wrong'),
    };
  }
}

export async function validatePayboxPayment({
  params,
  workspaceURL,
}: ValidatePayboxPaymentInput) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const parsedPayboxValidation = ValidatePayboxPaymentSchema.safeParse({
    params,
    workspaceURL,
  });
  if (!parsedPayboxValidation.success) {
    return {
      error: true,
      message: z.prettifyError(parsedPayboxValidation.error),
    };
  }

  const user = session?.user;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid tenant'),
    };
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const hasShopAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    client,
  });

  if (!hasShopAccess) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!workspace?.config?.confirmOrder) {
    return {
      error: true,
      message: await t('Not allowed'),
    };
  }

  if (!workspace?.config?.allowOnlinePaymentForEcommerce) {
    return {
      error: true,
      message: await t('Online payment is not available'),
    };
  }

  const allowPaybox = isPaymentOptionAvailable(
    workspace?.config?.paymentOptionSet,
    PaymentOption.paybox,
  );
  if (!allowPaybox) {
    return {
      error: true,
      message: await t('Paybox is not available'),
    };
  }

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
    client,
  });

  if (hidePriceAndPurchase) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  let paidAmount, cart, context;
  try {
    const order = await findPayboxOrder({params, client});
    cart = order.context.data;
    paidAmount = order.amount;
    context = order.context;
  } catch (err) {
    return {
      error: true,
      message:
        err instanceof Error ? err.message : await t('Something went wrong'),
    };
  }

  const {total} = computeTotal({
    cart,
    workspace,
    formatNumber,
  });

  const expectedAmount = computeExpectedAmount({total, workspace});

  if (Number(paidAmount) !== Number(expectedAmount)) {
    return {
      error: true,
      message: await t('Payment amount mismatch'),
    };
  }

  const paymentModeId = getPaymentModeId(
    workspace?.config?.paymentOptionSet,
    PaymentOption.paybox,
  );

  try {
    const res = await createOrder({
      cart,
      workspace,
      user,
      client,
      config: tenant.config,
      paymentModeId,
    });
    await markPaymentAsProcessed({
      contextId: context.id,
      version: context.version,
      client,
    });
    return res;
  } catch (err) {
    return {
      error: true,
      message:
        err instanceof Error ? err.message : await t('Something went wrong'),
    };
  }
}
