'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {clone} from '@/utils';
import {TENANT_HEADER} from '@/proxy';
import {manager} from '@/tenant';
import type {Product} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';
import type {Cloned} from '@/types/util';

// ---- LOCAL IMPORTS ---- //
import {findProduct as $findProduct} from '@/subapps/shop/common/orm/product';
import {findCategories} from '@/subapps/shop/common/orm/categories';
import {getcategoryids} from '@/subapps/shop/common/utils/categories';
import {requestOrder} from '@/subapps/shop/common/service';
import {IdSchema} from '@/utils/validators';
import {CartSchema, type CartInput} from '@/subapps/shop/common/validators';

export async function findProduct({
  id,
  workspace,
}: {
  id: Product['id'];
  workspace?: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  if (!IdSchema.safeParse(id).success) return null;

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

  const categoryids = categories.map(c => getcategoryids(c)).flat();

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
  cart: CartInput;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  if (!CartSchema.safeParse(cart).success) return null;

  return requestOrder({
    cart,
    workspace,
    type: 'quotation',
  });
}
