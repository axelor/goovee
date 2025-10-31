import {manager} from '@/tenant';
import {t} from '@/lib/core/locale/server';
import type {Tenant} from '@/tenant';
import type {ID} from '@/types';
import type {OrderByOptions} from '@goovee/orm';
import type {
  AOSPartner,
  AOSPortalDirectoryEntry,
} from '@/goovee/.generated/models';

import type {Entry, ListEntry, SearchEntry} from '../types';
import {and} from '@/utils/orm';

export async function findEntryImage({
  id,
  tenantId,
}: {
  id: ID;
  tenantId: Tenant['id'];
}): Promise<string | undefined> {
  if (!(id && tenantId)) {
    throw new Error(await t('Missing required parameters'));
  }

  const c = await manager.getClient(tenantId);

  const entry = await c.aOSPartner.findOne({
    where: {
      id,
      isInDirectory: true,
      OR: [{archived: false}, {archived: null}],
    },
    select: {picture: {id: true}},
  });
  return entry?.picture?.id;
}

export async function findEntry({
  id,
  tenantId,
}: {
  id: ID;
  tenantId: Tenant['id'];
}): Promise<Entry | null> {
  if (!(id && tenantId)) {
    throw new Error(await t('Missing required parameters'));
  }

  const c = await manager.getClient(tenantId);

  const entry = await c.aOSPartner.findOne({
    where: {
      id: id,
      isInDirectory: true,
      isCustomer: true,
      OR: [{archived: false}, {archived: null}],
    },
    select: {
      id: true,
      simpleFullName: true,
      directoryCompanyDescription: true,
      mainAddress: {formattedFullName: true, longit: true, latit: true},
      picture: {id: true},
      isAddressInDirectory: true,
      emailAddress: {address: true},
      fixedPhone: true,
      mobilePhone: true,
      webSite: true,
      linkedinLink: true,
      isEmailInDirectory: true,
      isPhoneInDirectory: true,
      isWebsiteInDirectory: true,
      mainPartnerContacts: {
        where: {isInDirectory: true},
        select: {
          id: true,
          simpleFullName: true,
          functionBusinessCard: true,
          emailAddress: {address: true},
          fixedPhone: true,
          mobilePhone: true,
          linkedinLink: true,
          picture: {id: true},
        },
      },
    },
  });
  return entry;
}

export async function findEntries({
  take,
  skip,
  tenantId,
  orderBy,
  search,
}: {
  take?: number;
  skip?: number;
  search?: string;
  tenantId: Tenant['id'];
  orderBy?: OrderByOptions<AOSPortalDirectoryEntry>;
}): Promise<ListEntry[]> {
  if (!tenantId) {
    throw new Error(await t('Missing required parameters'));
  }
  const c = await manager.getClient(tenantId);
  const entries = await c.aOSPartner.find({
    where: and<AOSPartner>([
      {
        isInDirectory: true,
        isCustomer: true,
        OR: [{archived: false}, {archived: null}],
      },
      search && {
        OR: [
          {simpleFullName: {like: `%${search}%`}},
          {mainAddress: {zip: {like: `%${search}%`}}},
          {mainAddress: {formattedFullName: {like: `%${search}%`}}},
          {mainAddress: {city: {name: {like: `%${search}%`}}}},
        ],
      },
    ]),
    orderBy,
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    select: {
      id: true,
      simpleFullName: true,
      directoryCompanyDescription: true,
      mainAddress: {formattedFullName: true, longit: true, latit: true},
      picture: {id: true},
      isAddressInDirectory: true,
    },
  });
  return entries;
}

export async function findEntriesBySearch({
  tenantId,
  search,
}: {
  search?: string;
  tenantId: Tenant['id'];
}): Promise<SearchEntry[]> {
  if (!tenantId) {
    throw new Error(await t('Missing required parameters'));
  }
  const c = await manager.getClient(tenantId);
  const entries = await c.aOSPartner.find({
    take: 10,
    where: and<AOSPartner>([
      {
        isInDirectory: true,
        isCustomer: true,
        OR: [{archived: false}, {archived: null}],
      },
      search && {
        OR: [
          {simpleFullName: {like: `%${search}%`}},
          {mainAddress: {zip: {like: `%${search}%`}}},
          {mainAddress: {formattedFullName: {like: `%${search}%`}}},
          {mainAddress: {city: {name: {like: `%${search}%`}}}},
        ],
      },
    ]),
    select: {simpleFullName: true},
  });
  return entries;
}
