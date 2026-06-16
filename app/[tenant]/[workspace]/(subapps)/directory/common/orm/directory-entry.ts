import type {AOSPartner} from '@/goovee/.generated/models';
import type {Client} from '@/goovee/.generated/client';
import {t} from '@/lib/core/locale/server';
import type {ID} from '@/types';
import type {OrderByOptions} from '@goovee/orm';

import {and} from '@/utils/orm';
import {
  getCompanyAccessFilter,
  getContactAccessFilter,
  maskAddressByAccess,
  maskEntryByAccess,
} from './helper';
import {ExpandRecursively} from '@/types/util';

export type Entry = ExpandRecursively<
  NonNullable<Awaited<ReturnType<typeof findEntry>>>
>;

export async function findEntry({id, client}: {id: ID; client: Client}) {
  if (!id) {
    throw new Error(await t('Missing required parameters'));
  }

  const entry = await client.aOSPartner.findOne({
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
  client,
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
  client: Client;
  orderBy?: OrderByOptions<AOSPartner>;
}) {
  const entries = await client.aOSPartner.find({
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
  return entries.map(maskAddressByAccess);
}
