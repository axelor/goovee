import type {Client} from '@/goovee/.generated/client';
import type {ID} from '@/types';

// ---- PARTNER LOOKUPS ---- //

export type PartnerWithFavorite = NonNullable<
  Awaited<ReturnType<typeof findPartnerWithFavorite>>
>;

export async function findPartnerWithFavorite({
  client,
  userId,
  productId,
}: {
  client: Client;
  userId: ID;
  productId: ID;
}) {
  return client.aOSPartner.findOne({
    where: {id: userId},
    select: {
      id: true,
      favouriteMarketplaceProducts: {
        where: {id: productId},
        select: {id: true},
      },
    },
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
        /* This list picks the address stamped on the new invoice — a new
         * use, not an existing relation — so archived rows are excluded. */
        where: {
          OR: [{archived: false}, {archived: null}],
          isInvoicingAddr: true,
        },
        select: {id: true, isDefaultAddr: true},
      },
    },
  });
}
