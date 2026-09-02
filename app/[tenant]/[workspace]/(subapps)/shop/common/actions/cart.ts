'use server';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';
import type {Product} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {findProduct as $findProduct} from '@/subapps/shop/common/orm/product';
import {getShopConfig} from '@/subapps/shop/common/orm/config';
import {findCategories} from '@/subapps/shop/common/orm/categories';
import {getcategoryids} from '@/subapps/shop/common/utils/categories';
import {requestOrder} from '@/subapps/shop/common/service';
import {IdSchema} from '@/utils/validators';
import {CartSchema, type CartInput} from '@/subapps/shop/common/validators';

export async function findProduct({id}: {id: Product['id']}) {
  if (!IdSchema.safeParse(id).success) return null;

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    allowGuest: true,
  });
  if (!access.ok) return null;

  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getShopConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return null;

  const categories = await findCategories(access.workspace.id, user, client);

  const categoryids = categories.map(c => getcategoryids(c)).flat();

  return await $findProduct({
    id,
    workspace: access.workspace,
    workspaceConfig,
    user,
    client,
    config,
    categoryids,
  }).then(clone);
}

export async function requestQuotation({cart}: {cart: CartInput}) {
  if (!CartSchema.safeParse(cart).success) return null;

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    allowGuest: false,
  });
  if (!access.ok) return null;

  const {client} = access.tenant;

  const workspaceConfig = await getShopConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return null;

  return requestOrder({
    cart,
    workspace: access.workspace,
    workspaceConfig,
    type: 'quotation',
  });
}
