'use server';

import axios from 'axios';
import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {DEFAULT_CURRENCY_CODE, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/middleware';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {createPayboxOrder, findPayboxOrder} from '@/payment/paybox/actions';
import {createPaypalOrder, findPaypalOrder} from '@/payment/paypal/actions';
import {createStripeOrder, findStripeOrder} from '@/payment/stripe/actions';
import {manager, type Tenant} from '@/tenant';
import {PaymentOption} from '@/types';
import {computeTotal} from '@/utils/cart';

// ---- LOCAL IMPORTS ---- //
import {findGooveeUserByEmail} from '@/orm/partner';
import {findProduct} from '@/subapps/shop/common/orm/product';
import {shouldHidePricesAndPurchase} from '@/orm/product';
import {markPaymentAsProcessed} from '@/lib/core/payment/common/orm';

const formatNumber = (n: any) => n;

async function createOrder({
  cart,
  workspaceURL,
  tenantId,
}: {
  cart: any;
  workspaceURL: string;
  tenantId: Tenant['id'];
}) {
  if (!cart?.items?.length) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const tenant = await manager.getTenant(tenantId);

  if (!tenant?.config?.aos?.url) {
    return {
      error: true,
      message: await t('Order creation failed. Webservice not available'),
    };
  }

  const {aos} = tenant.config;

  const ws = `${aos.url}/ws/portal/orders/order`;

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const workspace = await findWorkspace({
    url: workspaceURL,
    user,
    tenantId,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  try {
    const computedProducts = await Promise.all(
      cart.items.map((i: any) =>
        findProduct({id: i.product, workspace, user, tenantId}),
      ),
    );

    const $cart = {
      ...cart,
      items: [
        ...cart?.items?.map((i: any) => ({
          ...i,
          computedProduct: computedProducts.find(
            cp => Number(cp?.product?.id) === Number(i.product),
          ),
        })),
      ],
    };

    const {total} = computeTotal({
      cart: $cart,
      workspace,
      formatNumber,
    });

    let partnerId, contactId;

    if (user) {
      const {id, isContact, mainPartnerId} = user;
      if (isContact && mainPartnerId) {
        partnerId = mainPartnerId;
        contactId = id;
      } else {
        partnerId = id;
      }
    }

    const {invoicingAddress, deliveryAddress} = cart;

    const payload = {
      partnerId,
      contactId,
      shipping: 0,
      total,
      inAti: workspace?.config?.mainPrice === 'ati',
      items: $cart.items.map((i: any) => {
        const {computedProduct, note, quantity} = i;
        if (!computedProduct) return null;
        const {product, price} = computedProduct;
        return {
          productId: product?.id,
          note: note || '',
          quantity,
          price: price?.ati,
        };
      }),
      workspaceId: workspace.id,
      invocingPartnerAddressId: invoicingAddress,
      deliveryPartnerAddressId: deliveryAddress,
    };

    const res = await axios.post(ws, payload, {
      auth: {
        username: aos.auth.username,
        password: aos.auth.password,
      },
    });

    if (res?.data?.status === -1) {
      return {
        error: true,
        message: await t('Error creating order. Try again.'),
      };
    }

    return res?.data;
  } catch (err) {
    return {
      error: true,
      message: await t('Error creating order. Try again.'),
    };
  }
}

export async function paypalCaptureOrder({
  orderId,
  workspaceURL,
}: {
  orderId: string;
  workspaceURL: string;
}) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!orderId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  if (!workspaceURL) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const user = session?.user;

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid tenant'),
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
      message: await t('Invalid workspace'),
    };
  }

  const hasShopAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    tenantId,
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

  const allowPaypal = workspace?.config?.paymentOptionSet?.find(
    (o: any) => o?.typeSelect === PaymentOption.paypal,
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
    tenantId,
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
      tenantId,
    });

    const cart = context.data;

    const {total} = computeTotal({
      cart,
      workspace,
      formatNumber,
    });

    if (Number(amount) !== Number(total)) {
      return {
        error: true,
        message: await t('Amount mismatched'),
      };
    }

    const res = await createOrder({cart, workspaceURL, tenantId});
    await markPaymentAsProcessed({
      contextId: context.id,
      version: context.version,
      tenantId,
    });
    return res;
  } catch (err) {
    return {
      error: true,
      message: await t((err as any)?.message),
    };
  }
}

export async function paypalCreateOrder({
  cart,
  workspaceURL,
}: {
  cart: any;
  workspaceURL: string;
}) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!cart?.items?.length) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  if (!workspaceURL) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid tenant'),
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
      message: await t('Invalid workspace'),
    };
  }

  const hasShopAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    tenantId,
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

  const allowPaypal = workspace?.config?.paymentOptionSet?.find(
    (o: any) => o?.typeSelect === PaymentOption.paypal,
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
    tenantId,
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

  const payer = await findGooveeUserByEmail(user?.email, tenantId);

  try {
    const response = await createPaypalOrder({
      tenantId,
      context: cart,
      amount: total,
      currency: currency?.code,
      email: payer?.emailAddress?.address!,
    });

    return {success: true, order: response?.result};
  } catch (err) {
    return {
      error: true,
      message: await t((err as any)?.message),
    };
  }
}

export async function createStripeCheckoutSession({
  cart,
  workspaceURL,
}: {
  cart: any;
  workspaceURL: string;
}) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!cart?.items?.length) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  if (!workspaceURL) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid tenant'),
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
      message: await t('Invalid workspace'),
    };
  }

  const hasShopAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    tenantId,
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

  const allowStripe = workspace?.config?.paymentOptionSet?.find(
    (o: any) => o?.typeSelect === PaymentOption.stripe,
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
    tenantId,
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

  const payer = await findGooveeUserByEmail(user.email, tenantId);

  const currencyCode = currency?.code || DEFAULT_CURRENCY_CODE;

  try {
    const session = await createStripeOrder({
      tenantId,
      customer: {
        id: payer?.id!,
        email: payer?.emailAddress?.address!,
      },
      name: 'Cart Checkout',
      amount: Number(total),
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
      message: await t((err as any)?.message),
    };
  }
}

export async function validateStripePayment({
  stripeSessionId,
  workspaceURL,
}: {
  stripeSessionId: string;
  workspaceURL: string;
}) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!workspaceURL) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const user = session?.user;

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid tenant'),
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
      message: await t('Invalid workspace'),
    };
  }

  const hasShopAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    tenantId,
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

  const allowStripe = workspace?.config?.paymentOptionSet?.find(
    (o: any) => o?.typeSelect === PaymentOption.stripe,
  );

  if (!allowStripe) {
    return {
      error: true,
      message: await t('Stripe is not available'),
    };
  }

  if (!stripeSessionId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
    tenantId,
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
      tenantId,
    });
    cart = order.context.data;
    paidAmount = order.amount;
    context = order.context;
  } catch (err) {
    return {
      error: true,
      message: await t((err as any)?.message),
    };
  }

  const {total} = computeTotal({
    cart,
    workspace,
    formatNumber,
  });

  if (Number(paidAmount) !== Number(total)) {
    return {
      error: true,
      message: await t('Payment amount mistmatch'),
    };
  }

  const res = await createOrder({cart, workspaceURL, tenantId});
  await markPaymentAsProcessed({
    contextId: context.id,
    version: context.version,
    tenantId,
  });
  return res;
}

export async function payboxCreateOrder({
  cart,
  workspaceURL,
  uri,
}: {
  cart: any;
  workspaceURL: string;
  uri: string;
}) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!cart?.items?.length) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  if (!workspaceURL) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid tenant'),
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
      message: await t('Invalid workspace'),
    };
  }

  const hasShopAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    tenantId,
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

  const allowPaybox = workspace?.config?.paymentOptionSet?.find(
    (o: any) => o?.typeSelect === PaymentOption.paybox,
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
    tenantId,
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

  const payer = await findGooveeUserByEmail(user?.email, tenantId);

  try {
    const response = await createPayboxOrder({
      tenantId,
      amount: total,
      currency: currency?.code,
      email: payer?.emailAddress?.address!,
      context: cart,
      url: {
        success: `${process.env.GOOVEE_PUBLIC_HOST}/${uri}?paybox_response=true`,
        failure: `${process.env.GOOVEE_PUBLIC_HOST}/${uri}?paybox_error=true`,
      },
    });

    return {success: true, order: response};
  } catch (err) {
    return {
      error: true,
      message: await t((err as any)?.message),
    };
  }
}

export async function validatePayboxPayment({
  params,
  workspaceURL,
}: {
  params: any;
  workspaceURL: string;
}) {
  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!workspaceURL) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const user = session?.user;

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid tenant'),
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
      message: await t('Invalid workspace'),
    };
  }

  const hasShopAccess = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user,
    url: workspace.url,
    tenantId,
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

  const allowPaybox = workspace?.config?.paymentOptionSet?.find(
    (o: any) => o?.typeSelect === PaymentOption.paybox,
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
    tenantId,
  });

  if (hidePriceAndPurchase) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  if (!params) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  let paidAmount, cart, context;
  try {
    const order = await findPayboxOrder({params, tenantId});
    cart = order.context.data;
    paidAmount = order.amount;
    context = order.context;
  } catch (err) {
    return {
      error: true,
      message: await t((err as any)?.message),
    };
  }

  const {total} = computeTotal({
    cart,
    workspace,
    formatNumber,
  });

  if (Number(total) !== Number(paidAmount)) {
    return {
      error: true,
      message: await t('Payment amount mistmatch'),
    };
  }

  const res = await createOrder({cart, workspaceURL, tenantId});
  await markPaymentAsProcessed({
    contextId: context.id,
    version: context.version,
    tenantId,
  });
  return res;
}
