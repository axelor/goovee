import type {AOSPartner} from '@/goovee/.generated/models';
import {t} from '@/lib/core/locale/server';
import type {Tenant} from '@/tenant';
import {manager} from '@/tenant';
import type {ID} from '@/types';
import type {OrderByOptions} from '@goovee/orm';

import {and} from '@/utils/orm';
import {
  getCompanyAccessFilter,
  getContactAccessFilter,
  maskEntryByAccess,
} from './helper';
import {ExpandRecursively} from '@/types/util';

export type Entry = ExpandRecursively<
  NonNullable<Awaited<ReturnType<typeof findEntry>>>
>;

export async function findEntry({
  id,
  tenantId,
}: {
  id: ID;
  tenantId: Tenant['id'];
}) {
  if (!(id && tenantId)) {
    throw new Error(await t('Missing required parameters'));
  }

  const c = await manager.getClient(tenantId);

  const entry = await c.aOSPartner.findOne({
    where: and<AOSPartner>([{id}, getCompanyAccessFilter()]),
    select: {
      id: true,
      portalCompanyName: true,
      directoryCompanyDescription: true,
      picture: {id: true},
      isAddressInDirectory: true,
      mainAddress: {formattedFullName: true, longit: true, latit: true},
      isEmailInDirectory: true,
      emailAddress: {address: true},
      isPhoneInDirectory: true,
      fixedPhone: true,
      mobilePhone: true,
      isWebsiteInDirectory: true,
      webSite: true,
      mainPartnerContacts: {
        where: getContactAccessFilter(),
        select: {
          id: true,
          firstName: true,
          name: true,
          titleSelect: true,
          picture: {id: true},
          isFunctionInDirectory: true,
          jobTitleFunction: {name: true},
          isEmailInDirectory: true,
          emailAddress: {address: true},
          isPhoneInDirectory: true,
          fixedPhone: true,
          mobilePhone: true,
          isLinkedinInDirectory: true,
          linkedinLink: true,
        },
      } as {
        select: {
          id: true;
          firstName: true;
          name: true;
          titleSelect: true;
          picture: {id: true};
          isFunctionInDirectory: true;
          jobTitleFunction: {name: true};
          isEmailInDirectory: true;
          emailAddress: {address: true};
          isPhoneInDirectory: true;
          fixedPhone: true;
          mobilePhone: true;
          isLinkedinInDirectory: true;
          linkedinLink: true;
        };
      },
    },
  });

  if (!entry) return null;
  return maskEntryByAccess(entry);
}

export type ListEntry = ExpandRecursively<
  NonNullable<Awaited<ReturnType<typeof findEntries>>[number]>
>;

export async function findEntries({
  take,
  skip,
  tenantId,
  orderBy,
  search,
  city,
  zip,
}: {
  take?: number;
  skip?: number;
  city?: string;
  zip?: string;
  search?: string;
  tenantId: Tenant['id'];
  orderBy?: OrderByOptions<AOSPartner>;
}) {
  if (!tenantId) {
    throw new Error(await t('Missing required parameters'));
  }
  const c = await manager.getClient(tenantId);
  const entries = await c.aOSPartner.find({
    where: and<AOSPartner>([
      getCompanyAccessFilter(),
      city && {mainAddress: {city: {name: {like: `%${city}%`}}}},
      zip && {mainAddress: {zip: {like: `%${zip}%`}}},
      search && {
        OR: [
          {portalCompanyName: {like: `%${search}%`}},
          {directoryCompanyDescription: {like: `%${search}%`}},
        ],
      },
    ]),
    orderBy,
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    select: {
      id: true,
      portalCompanyName: true,
      directoryCompanyDescription: true,
      picture: {id: true},
      isAddressInDirectory: true,
      mainAddress: {formattedFullName: true, longit: true, latit: true},
    },
  });
  return entries.map(maskEntryByAccess);
}
