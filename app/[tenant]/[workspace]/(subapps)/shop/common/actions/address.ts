'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {TENANT_HEADER} from '@/proxy';
import {
  findDefaultDeliveryAddress,
  findDefaultInvoicingAddress,
  findDeliveryAddresses,
  findInvoicingAddresses,
  findPartnerAddress,
} from '@/orm/address';
import {SUBAPP_CODES} from '@/constants';
import type {ID} from '@/types';
import {clone, getPartnerId} from '@/utils';
import {IdSchema, WorkspaceURLSchema} from '@/utils/validators';

export async function findDefaultInvoicing({
  workspaceURL,
}: {
  workspaceURL: string;
}) {
  if (!WorkspaceURLSchema.safeParse(workspaceURL).success) return null;

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return null;

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) return null;

  const userId = getPartnerId(access.user);
  return findDefaultInvoicingAddress(userId, access.tenant.client).then(clone);
}

export async function findDefaultDelivery({
  workspaceURL,
}: {
  workspaceURL: string;
}) {
  if (!WorkspaceURLSchema.safeParse(workspaceURL).success) return null;

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return null;

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) return null;

  const userId = getPartnerId(access.user);
  return findDefaultDeliveryAddress(userId, access.tenant.client).then(clone);
}

export async function findAddress({
  id,
  workspaceURL,
}: {
  id: ID;
  workspaceURL: string;
}) {
  if (!IdSchema.safeParse(id).success) return null;
  if (!WorkspaceURLSchema.safeParse(workspaceURL).success) return null;

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return null;

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) return null;

  const userId = getPartnerId(access.user);
  return findPartnerAddress({
    partnerId: userId,
    addressId: id,
    client: access.tenant.client,
  }).then(clone);
}

export async function fetchDeliveryAddresses({
  workspaceURL,
}: {
  workspaceURL: string;
}) {
  if (!WorkspaceURLSchema.safeParse(workspaceURL).success) return null;

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return null;

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) return null;

  const userId = getPartnerId(access.user);
  return findDeliveryAddresses(userId, access.tenant.client).then(clone);
}

export async function fetchInvoicingAddresses({
  workspaceURL,
}: {
  workspaceURL: string;
}) {
  if (!WorkspaceURLSchema.safeParse(workspaceURL).success) return null;

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return null;

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) return null;

  const userId = getPartnerId(access.user);
  return findInvoicingAddresses(userId, access.tenant.client).then(clone);
}
