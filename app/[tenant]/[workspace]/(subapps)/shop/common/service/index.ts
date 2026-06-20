import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {aosClient} from '@/service';
import {t} from '@/locale/server';
import {PortalWorkspace} from '@/orm/workspace';
import {Cloned} from '@/types/util';
import type {Tenant} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import type {User} from '@/types';
import type {SuccessResponse} from '@/types/action';
import type {CartInput, CartItemInput} from '@/subapps/shop/common/validators';
import {computeTotal} from '@/utils/cart';
import {TENANT_HEADER} from '@/proxy';
import {getSession} from '@/auth';
import {manager} from '@/tenant';
import {MAIN_PRICE} from '@/constants';
import {calculateAdvanceAmount} from '@/utils/payment';

// ---- LOCAL IMPORTS ---- //
import {findProduct} from '@/subapps/shop/common/orm/product';
import {formatNumber} from '@/subapps/shop/common/utils/order';

export async function createOrder({
  cart,
  workspace,
  user,
  client,
  config,
  paymentModeId,
}: {
  cart: CartInput;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user: NonNullable<User>;
  client: Client;
  config: Tenant['config'];
  paymentModeId?: string;
}): Promise<SuccessResponse<string>> {
  const {aos} = config;

  const computedProducts = await Promise.all(
    cart.items.map((i: CartItemInput) =>
      findProduct({id: i.product, workspace, user, client, config}),
    ),
  );

  const $cart = {
    ...cart,
    items: cart.items.map((i: CartItemInput) => ({
      ...i,
      computedProduct:
        computedProducts.find(
          cp => Number(cp?.product?.id) === Number(i.product),
        ) ?? undefined,
    })),
  };

  const {total} = computeTotal({cart: $cart, workspace, formatNumber});

  const {id, isContact, mainPartnerId} = user;
  const partnerId = isContact && mainPartnerId ? mainPartnerId : id;
  const contactId = isContact && mainPartnerId ? id : undefined;

  const {invoicingAddress, deliveryAddress} = cart;
  const payInAdvance = workspace.config?.payInAdvance;
  const advancePaymentPercentage = workspace.config?.advancePaymentPercentage;

  const paidAmount =
    payInAdvance && Number(advancePaymentPercentage) > 0
      ? calculateAdvanceAmount({
          amount: Number(total),
          percentage: Number(advancePaymentPercentage),
          payInAdvance,
        }).toString()
      : Number(total).toString();

  const isAtiPricing = workspace?.config?.mainPrice === MAIN_PRICE.ATI;

  const payload = {
    partnerId,
    contactId,
    shipping: 0,
    total,
    inAti: isAtiPricing,
    items: $cart.items.map(i => {
      const {computedProduct, note, quantity} = i;
      if (!computedProduct) return null;
      const {product, price} = computedProduct;
      return {
        productId: product?.id,
        note: note || '',
        quantity,
        price: isAtiPricing ? price?.ati : price?.wt,
      };
    }),
    workspaceId: workspace.id,
    invocingPartnerAddressId: invoicingAddress,
    deliveryPartnerAddressId: deliveryAddress,
    paidAmount,
    paymentModeId,
  };

  const res = await aosClient(aos).request<{
    status?: number;
    message?: string;
    data?: string;
  }>('ws/portal/orders/order', {body: payload});

  if (res?.status === -1) {
    throw new Error(
      res?.message
        ? await t(res.message)
        : await t('Order creation failed. Please try again.'),
    );
  }

  return {success: true, data: res.data ?? ''};
}

export async function requestOrder({
  cart,
  workspace,
  type = 'order',
}: {
  cart: CartInput;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  type?: 'quotation' | 'order';
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return null;
  }

  if (!cart?.items?.length) return null;

  const tenant = await manager.getTenant(tenantId);

  if (!tenant?.config?.aos?.url) return null;

  const {aos} = tenant.config;
  const {client, config} = tenant;

  const session = await getSession();
  const user = session?.user;

  if (!(session && workspace && workspace.config)) return null;

  try {
    const computedProducts = (
      await Promise.all(
        cart.items.map(i =>
          findProduct({id: i.product, workspace, user, client, config}),
        ),
      )
    ).filter(Boolean);

    const $cart = {
      ...cart,
      items: [
        ...cart.items.map(i => ({
          ...i,
          computedProduct:
            computedProducts.find(
              cp => Number(cp?.product?.id) === Number(i.product),
            ) ?? undefined,
        })),
      ],
    };

    const {total} = computeTotal({cart: $cart, workspace, formatNumber});

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
    const isAtiPricing = workspace?.config?.mainPrice === MAIN_PRICE.ATI;

    const payload = {
      partnerId,
      contactId,
      shipping: 0,
      total,
      inAti: isAtiPricing,
      items: $cart.items.map(i => {
        const {computedProduct, note, quantity} = i;
        if (!computedProduct) return null;
        const {product, price} = computedProduct;
        return {
          productId: product?.id,
          note: note || '',
          quantity,
          price: isAtiPricing ? price?.ati : price?.wt,
        };
      }),
      workspaceId: workspace.id,
      invocingPartnerAddressId: invoicingAddress,
      deliveryPartnerAddressId: deliveryAddress,
    };

    const res = await aosClient(aos).request<
      {status?: number} & Record<string, unknown>
    >(`ws/portal/orders/${type}`, {body: payload});

    if (res?.status === -1) {
      return null;
    }

    return res;
  } catch (err) {
    console.error(err);
    return null;
  }
}
