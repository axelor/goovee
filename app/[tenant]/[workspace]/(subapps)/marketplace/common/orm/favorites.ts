import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceProduct} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {and, or} from '@/utils/orm';
import type {Workspace} from '@/orm/workspace';
import type {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import type {MarketplaceConfig} from './config';
import {
  priceSelectFields,
  withPublishedProductFilter,
  type ORMRecord,
} from './helpers';
import {getPriceContext, withPrice} from './price';

// ---- FAVORITE LOOKUPS ---- //

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

export async function isProductFavorited({
  userId,
  productId,
  client,
}: {
  userId: ID;
  productId: ID;
  client: Client;
}): Promise<boolean> {
  const favorite = await client.aOSPartner.findOne({
    where: {
      id: userId,
      favouriteMarketplaceProducts: {id: productId},
    },
    select: {id: true},
  });

  return !!favorite;
}

export type ListFavoriteProduct = Awaited<
  ReturnType<typeof findFavoriteProducts>
>[number];

/** A page of the products a partner has favourited, scoped to those still
 *  accessible (workspace, non-archived, with a published version) so removed/
 *  unpublished listings drop out. Priced like the storefront listing.
 *
 *  Paginated through the favourite m2m relation: `take` makes goovee attach a
 *  window `_count` to the returned rows, read back via `getTotal`. */
export async function findFavoriteProducts({
  client,
  workspace,
  config,
  userId,
  mainPartnerId,
  search,
  type,
  priceType,
  take,
  skip,
}: {
  client: Client;
  workspace: Workspace;
  config: MarketplaceConfig;
  userId: ID;
  mainPartnerId?: string | null;
  search?: string;
  /** A marketplace type ('skill'/'app'); 'all' or undefined = no type filter. */
  type?: string;
  /** 'free' | 'paid' | 'all' (or undefined) — filters on the listing price. */
  priceType?: string;
  take?: number;
  skip?: number;
}) {
  const pattern = search ? `%${search}%` : undefined;
  /* Free = exactly zero, paid = strictly positive — matches the storefront. */
  const priceFilter =
    priceType === 'free'
      ? {salePrice: 0}
      : priceType === 'paid'
        ? {salePrice: {gt: 0}}
        : undefined;
  const partner = await client.aOSPartner.findOne({
    where: {id: userId},
    select: {
      favouriteMarketplaceProducts: {
        where: withPublishedProductFilter(workspace)(
          and<AOSMarketplaceProduct>([
            pattern &&
              or<AOSMarketplaceProduct>([
                {name: {like: pattern}},
                {description: {like: pattern}},
              ]),
            type &&
              type !== 'all' && {
                marketplaceTypeSelect: type as MARKETPLACE_TYPE,
              },
            priceFilter,
          ]),
        ),
        orderBy: {name: 'ASC'},
        ...(take != null ? {take} : {}),
        ...(skip ? {skip} : {}),
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          marketplaceTypeSelect: true,
          coverStyle: true,
          iconCode: true,
          averageRating: true,
          installCount: true,
          ...priceSelectFields,
        },
      },
    },
  });

  const favorites = partner?.favouriteMarketplaceProducts ?? [];

  const priceContext = await getPriceContext({
    client,
    mainPartnerId,
    productCurrencyCodes: favorites.map(
      product =>
        product.saleCurrency?.codeISO ?? product.product?.saleCurrency?.codeISO,
    ),
  });

  return favorites.map(product => withPrice(product, config, priceContext));
}

// ---- FAVORITE MUTATIONS ---- //

/** Sets a marketplace product's presence on the partner's
 *  favouriteMarketplaceProducts list to the requested state. Pass
 *  `isFavorite: true` to add, `false` to remove. Caller is expected to
 *  skip the call when the desired state already matches current state. */
export async function setPartnerFavorite({
  client,
  userId,
  version,
  productId,
  isFavorite,
}: {
  client: Client;
  userId: ID;
  version: number;
  productId: ID;
  isFavorite: boolean;
}): Promise<ORMRecord> {
  return client.aOSPartner.update({
    data: {
      id: userId,
      version,
      favouriteMarketplaceProducts: isFavorite
        ? {select: {id: productId}}
        : {remove: productId},
    },
    select: {id: true},
  });
}
