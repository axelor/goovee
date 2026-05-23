import type {Client} from '@/goovee/.generated/client';
import type {AOSProduct} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {and} from '@/utils/orm';
import type {SelectOptions} from '@goovee/orm';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {
  priceSelectFields,
  withMyProductAccessFilter,
  type QueryProps,
} from './helpers';
import {buildPriceContext, withPrice} from './price';

// ---- MY PRODUCTS (USER CONTRIBUTIONS) ---- //

const findMyProductsSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  code: true,
  picture: {id: true},
  thumbnailImage: {id: true},
  marketplaceTypeSelect: true,
  marketplaceCoverStyle: true,
  marketplaceIconCode: true,
  averageRating: true,
  ratingCount: true,
  installCount: true,
  ...priceSelectFields,
  currentVersion: {id: true, versionNumber: true, statusSelect: true},
} as const satisfies SelectOptions<AOSProduct>;

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
} & QueryProps<AOSProduct>) {
  const products = await client.aOSProduct.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: withMyProductAccessFilter(
      workspace,
      mainPartnerId,
    )(and<AOSProduct>([type && {marketplaceTypeSelect: type}, where])),
    select: findMyProductsSelect,
  });
  const priceContext = await buildPriceContext({
    client,
    mainPartnerId,
    productCurrencyCodes: products.map(p => p.saleCurrency?.code),
  });

  return products.map(p => withPrice(p, workspace, priceContext));
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
  const product = await client.aOSProduct.findOne({
    where: withMyProductAccessFilter(workspace, mainPartnerId)({id: productId}),
    select: {
      id: true,
      version: true,
      name: true,
      code: true,
      slug: true,
      description: true,
      longDescription: true,
      marketplaceTypeSelect: true,
      marketplaceCoverStyle: true,
      marketplaceIconCode: true,
      documentationUrl: true,
      supportIssuesUrl: true,
      supportContactUrl: true,
      productCategory: {id: true, name: true},
      currentVersion: {id: true},
      salePrice: true,
      portalImageList: {
        select: {id: true, picture: {id: true}},
      },
      versionList: {
        select: {
          id: true,
          version: true,
          versionNumber: true,
          changelog: true,
          statusSelect: true,
          dateOfApproval: true,
          bundleFile: {id: true, fileName: true, sizeText: true},
          compatibilitySet: {
            select: {id: true, title: true, name: true},
          },
        },
        orderBy: {
          dateOfApproval: 'DESC',
          dateOfSubmission: 'DESC',
          createdOn: 'DESC',
        },
      },
    },
  });

  return product;
}

export type CompatibilityVersion = Awaited<
  ReturnType<typeof findCompatibilityVersions>
>[number];

export async function findCompatibilityVersions(client: Client) {
  return client.aOSMarketplaceAxelorVersion.find({
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
  const count = await client.aOSProduct.count({
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
      favouriteProducts: {
        id: productId,
      },
    },
    select: {
      id: true,
    },
  });

  return !!favorite;
}
