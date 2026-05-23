import type {Client} from '@/goovee/.generated/client';
import type {AOSProduct} from '@/goovee/.generated/models';
import {ID} from '@/types';
import {and, or} from '@/utils/orm';
import type {Payload, SelectOptions} from '@goovee/orm';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {
  priceSelectFields,
  withProductAccessFilter,
  withPublishedProductFilter,
  type QueryProps,
} from './helpers';
import {buildPriceContext, withPrice} from './price';

// ---- PRODUCTS ---- //

export async function findProductAccess<T extends SelectOptions<AOSProduct>>({
  recordId: productId,
  client,
  workspace,
  select,
}: {
  recordId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  select?: T;
}): Promise<Payload<AOSProduct, {select: T}> | null> {
  const product = await client.aOSProduct.findOne({
    where: withProductAccessFilter(workspace)({
      id: productId,
    }),
    select: select as T,
  });

  return product;
}

export type ProductSearchResult = Awaited<
  ReturnType<typeof findProductsBySearch>
>[number];

export async function findProductsBySearch({
  search,
  type,
  client,
  workspace,
  take = 8,
}: {
  search: string;
  type?: MARKETPLACE_TYPE;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  take?: number;
}) {
  const pattern = `%${search}%`;
  const products = await client.aOSProduct.find({
    take,
    where: withPublishedProductFilter(workspace)(
      and<AOSProduct>([
        type ? {marketplaceTypeSelect: type} : undefined,
        or<AOSProduct>([
          {name: {like: pattern}},
          {description: {like: pattern}},
          {code: {like: pattern}},
        ]),
      ]),
    ),
    select: {
      id: true,
      slug: true,
      name: true,
      marketplaceIconCode: true,
      marketplaceCoverStyle: true,
      marketplaceTypeSelect: true,
    },
  });
  return products;
}

const findProductsSelect = {
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
  currentVersion: {id: true, versionNumber: true},
} as const satisfies SelectOptions<AOSProduct>;

export type ListProduct = Awaited<ReturnType<typeof findProducts>>[number];

export async function findProducts({
  client,
  workspace,
  mainPartnerId,
  where,
  take,
  skip,
  orderBy,
}: {
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  mainPartnerId?: string | null;
} & QueryProps<AOSProduct>) {
  const products = await client.aOSProduct.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: withPublishedProductFilter(workspace)({...where}),
    select: findProductsSelect,
  });
  const priceContext = await buildPriceContext({
    client,
    mainPartnerId,
    productCurrencyCodes: products.map(p => p.saleCurrency?.code),
  });

  return products.map(p => withPrice(p, workspace, priceContext));
}

const findProductSelect = {
  id: true,
  name: true,
  description: true,
  longDescription: true,
  code: true,
  slug: true,
  createdOn: true,
  picture: {id: true},
  thumbnailImage: {id: true},
  marketplaceTypeSelect: true,
  marketplaceCoverStyle: true,
  marketplaceIconCode: true,
  documentationUrl: true,
  supportIssuesUrl: true,
  supportContactUrl: true,
  averageRating: true,
  ratingCount: true,
  installCount: true,
  ...priceSelectFields,
  currentVersion: {
    id: true,
    versionNumber: true,
    statusSelect: true,
    changelog: true,
    dateOfApproval: true,
    bundleFile: {sizeText: true},
    compatibilitySet: {
      select: {title: true},
      orderBy: {releasedOn: 'DESC' as const},
    },
  },
  productCategory: {id: true, name: true},
  defaultSupplierPartner: {
    id: true,
    simpleFullName: true,
    name: true,
    picture: {id: true},
  },
  portalCategorySet: {select: {id: true, name: true}},
  portalImageList: {select: {picture: {id: true}}},
} as const satisfies SelectOptions<AOSProduct>;

export type SingleProduct = NonNullable<
  Awaited<ReturnType<typeof findProduct>>
>;

export async function findProduct({
  slug,
  client,
  workspace,
  mainPartnerId,
}: {
  slug: string;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  mainPartnerId?: string | null;
}) {
  const product = await client.aOSProduct.findOne({
    where: withPublishedProductFilter(workspace)({slug}),
    select: findProductSelect,
  });
  if (!product) return null;
  const priceContext = await buildPriceContext({
    client,
    mainPartnerId,
    productCurrencyCodes: [product.saleCurrency?.code],
  });
  return withPrice(product, workspace, priceContext);
}
