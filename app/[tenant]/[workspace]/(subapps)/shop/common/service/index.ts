import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {aosClient} from '@/service';
import {t} from '@/locale/server';
import {Workspace} from '@/orm/workspace';
import {Cloned} from '@/types/util';
import type {Tenant} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import type {ComputedProduct, User} from '@/types';
import type {SuccessResponse} from '@/types/action';
import type {CartInput, CartItemInput} from '@/subapps/shop/common/validators';
import {computeTotal} from '@/utils/cart';
import {TENANT_HEADER} from '@/proxy';
import {getSession} from '@/auth';
import {manager} from '@/tenant';
import {MAIN_PRICE} from '@/constants';
import {calculateAdvanceAmount} from '@/utils/payment';

// ---- LOCAL IMPORTS ---- //
import {findProducts} from '@/subapps/shop/common/orm/product';
import {findCategories} from '@/subapps/shop/common/orm/categories';
import {getcategoryids} from '@/subapps/shop/common/utils/categories';
import type {ShopConfig} from '@/subapps/shop/common/orm/config';
import {formatNumber} from '@/subapps/shop/common/utils/order';

/** A cart whose prices came from {@link priceCart}. */
export type PricedCart = Omit<CartInput, 'items'> & {
  items: (CartItemInput & {computedProduct: ComputedProduct})[];
};

/**
 * Prices a cart from the server's own product data, applying the catalogue
 * rules the product pages apply.
 *
 * `unavailable` — an item is gone, outside this workspace's catalogue, or the
 * shop is configured not to sell it while out of stock.
 * `unconfirmed` — the catalogue could not be read at all. Whether that is the
 * cart or the lookup is not knowable here, so neither is claimed.
 */
export async function priceCart({
  cart,
  workspace,
  workspaceConfig,
  user,
  client,
  config,
}: {
  cart: CartInput;
  workspace: Workspace | Cloned<Workspace>;
  workspaceConfig: ShopConfig | Cloned<ShopConfig>;
  user: NonNullable<User>;
  client: Client;
  config: Tenant['config'];
}): Promise<PricedCart | 'unavailable' | 'unconfirmed'> {
  /* Scoped to this workspace's catalogue, as the browse path scopes its own.
   * An empty list drops the category clause rather than matching nothing, so
   * it has to stop here — the same guard the product pages carry. */
  const categories = await findCategories(workspace.id, user, client);
  const categoryids = categories.map(c => getcategoryids(c)).flat();
  if (!categoryids.length) return 'unconfirmed';

  const {products} = await findProducts({
    ids: cart.items.map((i: CartItemInput) => i.product),
    categoryids,
    workspace,
    workspaceConfig,
    user,
    client,
    config,
  });

  /* An unreachable price webservice returns an empty list, exactly as a cart of
   * products that no longer exist does. The two are not distinguishable here. */
  if (!products.length) return 'unconfirmed';

  const items = cart.items.map((i: CartItemInput) => ({
    ...i,
    computedProduct: products.find(
      cp => Number(cp?.product?.id) === Number(i.product),
    ),
  }));

  /* `canBuy` is false for a product the shop shows but refuses to sell. */
  const unavailable = items.some(
    i =>
      !i.computedProduct ||
      i.computedProduct.product?.outOfStockConfig?.canBuy === false,
  );
  if (unavailable) return 'unavailable';

  return {...cart, items: items as PricedCart['items']};
}

/**
 * Takes a cart already priced by {@link priceCart}. Pricing again here would
 * let a change between checkout and capture put a total on the order that the
 * customer never paid.
 */
export async function createOrder({
  cart: $cart,
  workspace,
  workspaceConfig,
  user,
  config,
  paymentModeId,
}: {
  cart: PricedCart;
  workspace: Workspace | Cloned<Workspace>;
  workspaceConfig: ShopConfig | Cloned<ShopConfig>;
  user: NonNullable<User>;
  config: Tenant['config'];
  paymentModeId?: string;
}): Promise<SuccessResponse<string>> {
  const {aos} = config;

  const {total} = computeTotal({
    cart: $cart,
    config: workspaceConfig,
    formatNumber,
  });

  const {id, isContact, mainPartnerId} = user;
  const partnerId = isContact && mainPartnerId ? mainPartnerId : id;
  const contactId = isContact && mainPartnerId ? id : undefined;

  const {invoicingAddress, deliveryAddress} = $cart;
  const payInAdvance = workspaceConfig?.payInAdvance;
  const advancePaymentPercentage = workspaceConfig?.advancePaymentPercentage;

  const paidAmount =
    payInAdvance && Number(advancePaymentPercentage) > 0
      ? calculateAdvanceAmount({
          amount: Number(total),
          percentage: Number(advancePaymentPercentage),
          payInAdvance,
        }).toString()
      : Number(total).toString();

  const isAtiPricing = workspaceConfig?.mainPrice === MAIN_PRICE.ATI;

  const payload = {
    partnerId,
    contactId,
    shipping: 0,
    total,
    inAti: isAtiPricing,
    items: $cart.items.map(i => {
      const {computedProduct, note, quantity} = i;
      /* Only reachable for a payment context written before this shipped;
       * those expire five minutes after creation. */
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
  workspaceConfig,
  type = 'order',
}: {
  cart: CartInput;
  workspace: Workspace | Cloned<Workspace>;
  workspaceConfig: ShopConfig | Cloned<ShopConfig>;
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

  if (!(session && workspace && workspaceConfig)) return null;

  try {
    const {products: computedProducts} = await findProducts({
      ids: cart.items.map(i => i.product),
      workspace,
      workspaceConfig,
      user,
      client,
      config,
    });

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

    const {total} = computeTotal({
      cart: $cart,
      config: workspaceConfig,
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
    const isAtiPricing = workspaceConfig?.mainPrice === MAIN_PRICE.ATI;

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
