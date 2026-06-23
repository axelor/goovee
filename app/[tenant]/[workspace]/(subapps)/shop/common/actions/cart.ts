'use server';

import axios from 'axios';
import type {Cloned} from '@/types/util';
import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {clone} from '@/utils';
import {computeTotal} from '@/utils/cart';
import {TENANT_HEADER} from '@/proxy';
import {manager} from '@/tenant';
import type {Product} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';
import {MAIN_PRICE} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {findProduct as $findProduct} from '@/subapps/shop/common/orm/product';
import {findCategories} from '@/subapps/shop/common/orm/categories';
import {getcategoryids} from '@/subapps/shop/common/utils/categories';

const formatNumber = (n: any) => n;

export async function findProduct({
  id,
  workspace,
}: {
  id: Product['id'];
  workspace?: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return null;
  }

  if (!workspace) {
    return null;
  }

  const session = await getSession();
  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return null;
  const {client, config} = tenant;

  const categories = await findCategories({
    workspace,
    client,
    user,
  });

  const categoryids = (categories || [])
    .map((c: any) => getcategoryids(c))
    .flat();

  return await $findProduct({
    id,
    workspace,
    user,
    client,
    config,
    categoryids,
  }).then(clone);
}

export async function requestQuotation({
  cart,
  workspace,
}: {
  cart: any;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  return requestOrder({
    cart,
    workspace,
    type: 'quotation',
  });
}

async function requestOrder({
  cart,
  workspace,
  type = 'order',
}: {
  cart: any;
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

  const ws = `${aos.url}/ws/portal/orders/${type}`;

  const session = await getSession();
  const user = session?.user;

  if (!(session && workspace && workspace.config)) return null;

  try {
    const computedProducts = (
      await Promise.all(
        cart.items.map((i: any) =>
          findProduct({
            id: i.product,
            workspace,
          }),
        ),
      )
    ).filter(Boolean);

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
      items: $cart.items.map((i: any) => {
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

    const res = await axios.post(ws, payload, {
      auth: {
        username: aos.auth.username,
        password: aos.auth.password,
      },
    });

    if (res?.data?.status === -1) {
      return null;
    }

    return res?.data;
  } catch (err) {
    console.error(err);
    return null;
  }
}
