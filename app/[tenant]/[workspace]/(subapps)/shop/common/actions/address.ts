'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {TENANT_HEADER} from '@/proxy';
import {
  findDefaultDeliveryAddress,
  findDefaultInvoicingAddress,
  findDeliveryAddresses,
  findInvoicingAddresses,
  findPartnerAddress,
} from '@/orm/address';
import type {ID} from '@/types';
import {clone, getPartnerId} from '@/utils';

export async function findDefaultInvoicing() {
  const session = await getSession();
  const user = session?.user;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!(user && tenantId)) return null;

  const userId = getPartnerId(user);

  return findDefaultInvoicingAddress(userId, tenantId).then(clone);
}

export async function findDefaultDelivery() {
  const session = await getSession();
  const user = session?.user;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!(user && tenantId)) return null;

  const userId = getPartnerId(user);

  return findDefaultDeliveryAddress(userId, tenantId).then(clone);
}

export async function findAddress(id: ID) {
  const session = await getSession();
  const user = session?.user;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!(user && tenantId)) return null;

  const userId = getPartnerId(user);

  return findPartnerAddress({partnerId: userId, addressId: id, tenantId}).then(
    clone,
  );
}

export async function fetchDeliveryAddresses() {
  const session = await getSession();
  const user = session?.user;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!(user && tenantId)) return null;

  const userId = getPartnerId(user);

  return findDeliveryAddresses(userId, tenantId).then(clone);
}

export async function fetchInvoicingAddresses() {
  const session = await getSession();
  const user = session?.user;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!(user && tenantId)) return null;

  const userId = getPartnerId(user);

  return findInvoicingAddresses(userId, tenantId).then(clone);
}
