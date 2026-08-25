import type {Client} from '@/goovee/.generated/client';
import type {AOSPartner} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {and} from '@/utils/orm';
import {getCompanyAccessFilter} from '../../../directory/common/orm/helper';

// ---- PARTNER LOOKUPS ---- //

/**
 * The partner if the Directory lists them, otherwise null. Runs the
 * Directory's own filter rather than restating its conditions, so the two
 * cannot answer differently: a match here means its profile page resolves.
 */
export async function findPartnerInDirectory({
  client,
  partnerId,
}: {
  client: Client;
  partnerId: ID;
}) {
  return client.aOSPartner.findOne({
    where: and<AOSPartner>([{id: partnerId}, getCompanyAccessFilter()]),
    select: {id: true},
  });
}

export type PartnerInvoicingAddresses = NonNullable<
  Awaited<ReturnType<typeof findPartnerInvoicingAddresses>>
>;

export async function findPartnerInvoicingAddresses({
  client,
  mainPartnerId,
}: {
  client: Client;
  mainPartnerId: ID;
}) {
  return client.aOSPartner.findOne({
    where: {id: mainPartnerId},
    select: {
      partnerAddressList: {
        /* These addresses feed a new order — a new
         * use, not an existing relation — so archived rows are excluded. */
        where: {
          OR: [{archived: false}, {archived: null}],
          isInvoicingAddr: true,
        },
        select: {
          id: true,
          isDefaultAddr: true,
          address: {id: true, formattedFullName: true},
        },
      },
    },
  });
}
