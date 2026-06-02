import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceProduct} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {and} from '@/utils/orm';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {
  priceSelectFields,
  versionNumberFields,
  versionSortOrder,
  withMyProductAccessFilter,
  type QueryProps,
} from './helpers';
import {getPriceContext, withPrice} from './price';

export type ListMyProduct = Awaited<ReturnType<typeof findMyProducts>>[number];

export async function findMyProducts({
  mainPartnerId,
  client,
  workspace,
  type,
  where,
  take,
  skip,
  orderBy,
}: {
  mainPartnerId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  type?: MARKETPLACE_TYPE;
} & QueryProps<AOSMarketplaceProduct>) {
  // "My" === published by this partner; scoped by withMyProductAccessFilter.
  const products = await client.aOSMarketplaceProduct.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: withMyProductAccessFilter(
      workspace,
      mainPartnerId,
    )(
      and<AOSMarketplaceProduct>([
        type && {marketplaceTypeSelect: type},
        where,
      ]),
    ),
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      marketplaceTypeSelect: true,
      coverStyle: true,
      iconCode: true,
      averageRating: true,
      ratingCount: true,
      installCount: true,
      ...priceSelectFields,
      currentVersion: {id: true, ...versionNumberFields, statusSelect: true},
      latestVersion: {id: true, ...versionNumberFields, statusSelect: true},
    },
  });
  const priceContext = await getPriceContext({
    client,
    mainPartnerId,
    productCurrencyCodes: products.map(
      p => p.saleCurrency?.code ?? p.product?.saleCurrency?.code,
    ),
  });

  return products.map(p => withPrice(p, workspace, priceContext));
}

/** Lightweight ownership check: resolves the product only if it lives in
 *  the workspace and is published by the caller's partner. Use this when
 *  an action just needs to verify ownership, not load the edit payload. */
export async function findMyProductAccess({
  productId,
  mainPartnerId,
  client,
  workspace,
}: {
  productId: ID;
  mainPartnerId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
}) {
  return client.aOSMarketplaceProduct.findOne({
    where: withMyProductAccessFilter(workspace, mainPartnerId)({id: productId}),
    select: {id: true},
  });
}

export type MyProductWithVersions = NonNullable<
  Awaited<ReturnType<typeof findMyProductWithVersions>>
>;

export async function findMyProductWithVersions({
  productId,
  mainPartnerId,
  client,
  workspace,
}: {
  productId: ID;
  mainPartnerId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
}) {
  return client.aOSMarketplaceProduct.findOne({
    where: withMyProductAccessFilter(workspace, mainPartnerId)({id: productId}),
    select: {
      id: true,
      version: true,
      name: true,
      slug: true,
      description: true,
      longDescription: true,
      marketplaceTypeSelect: true,
      coverStyle: true,
      iconCode: true,
      documentationUrl: true,
      supportIssuesUrl: true,
      supportContactUrl: true,
      categorySet: {select: {id: true, name: true}},
      license: {id: true},
      currentVersion: {id: true},
      salePrice: true,
      pictureList: {
        select: {id: true, sequence: true, picture: {id: true}},
        orderBy: {sequence: 'ASC'},
      },
      versionList: {
        select: {
          id: true,
          version: true,
          ...versionNumberFields,
          changelog: true,
          statusSelect: true,
          dateOfPublish: true,
          bundleFile: {id: true, fileName: true, sizeText: true},
          compatibilitySet: {
            select: {id: true, title: true, name: true},
          },
        },
        orderBy: versionSortOrder,
      },
    },
  });
}

export type CompatibilityVersion = Awaited<
  ReturnType<typeof findCompatibilityVersions>
>[number];

export async function findCompatibilityVersions(client: Client) {
  return client.aOSMarketplaceAxelorVersion.find({
    where: {OR: [{archived: false}, {archived: null}]},
    select: {id: true, title: true, name: true, releasedOn: true},
    orderBy: {releasedOn: 'DESC'},
  });
}

export async function countMyProducts({
  mainPartnerId,
  client,
  workspace,
  type,
}: {
  mainPartnerId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  type?: MARKETPLACE_TYPE;
}): Promise<number> {
  const count = await client.aOSMarketplaceProduct.count({
    where: withMyProductAccessFilter(
      workspace,
      mainPartnerId,
    )(type && {marketplaceTypeSelect: type}),
  });

  return Number(count);
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
