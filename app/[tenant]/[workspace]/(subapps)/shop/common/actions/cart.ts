'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {clone} from '@/utils';
import {TENANT_HEADER} from '@/proxy';
import {SUBAPP_CODES} from '@/constants';
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
  workspaceURL,
}: {
  id: Product['id'];
  workspace?: PortalWorkspace | Cloned<PortalWorkspace>;
  workspaceURL: string;
}) {
  if (!IdSchema.safeParse(id).success) return null;

  if (!workspace) {
    return null;
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return null;
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) return null;

  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

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
  workspaceURL,
}: {
  cart: CartInput;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  workspaceURL: string;
}) {
  if (!CartSchema.safeParse(cart).success) return null;

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return null;

  const access = await ensureAuth({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) return null;

  return requestOrder({
    cart,
    workspace,
    type: 'quotation',
  });
}
