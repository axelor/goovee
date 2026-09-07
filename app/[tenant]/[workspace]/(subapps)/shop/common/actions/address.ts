'use server';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
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
import {IdSchema} from '@/utils/validators';

export async function findDefaultInvoicing() {
  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    allowGuest: false,
  });
  if (!access.ok) return null;

  const userId = getPartnerId(access.user);
  return findDefaultInvoicingAddress(userId, access.tenant.client).then(clone);
}

export async function findDefaultDelivery() {
  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    allowGuest: false,
  });
  if (!access.ok) return null;

  const userId = getPartnerId(access.user);
  return findDefaultDeliveryAddress(userId, access.tenant.client).then(clone);
}

export async function findAddress({id}: {id: ID}) {
  if (!IdSchema.safeParse(id).success) return null;

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
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

export async function fetchDeliveryAddresses() {
  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    allowGuest: false,
  });
  if (!access.ok) return null;

  const userId = getPartnerId(access.user);
  return findDeliveryAddresses(userId, access.tenant.client).then(clone);
}

export async function fetchInvoicingAddresses() {
  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    allowGuest: false,
  });
  if (!access.ok) return null;

  const userId = getPartnerId(access.user);
  return findInvoicingAddresses(userId, access.tenant.client).then(clone);
}
