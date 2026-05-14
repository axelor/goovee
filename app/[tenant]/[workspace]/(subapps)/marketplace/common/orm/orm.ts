import type {Entity, OrderByArg, WhereOptions} from '@goovee/orm';
import type {Client} from '@/goovee/.generated/client';
import type {AOSProduct, AOSProductCategory} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {and} from '@/utils/orm';

// ---- TYPES ---- //
export type QueryProps<T extends Entity> = {
  where?: WhereOptions<T> | null;
  take?: number;
  orderBy?: OrderByArg<T> | null;
  skip?: number;
};

export type ListProduct = Awaited<ReturnType<typeof findProducts>>[number];
export type SingleProduct = NonNullable<
  Awaited<ReturnType<typeof findProduct>>
>;
export type ListCategory = Awaited<ReturnType<typeof findProductCategories>>[number];

// ---- PRODUCT CATEGORIES ---- //

export async function findProductCategories(
  client: Client,
  props?: QueryProps<AOSProductCategory>,
) {
  const {where, take, skip, orderBy} = props ?? {};

  const categories = await client.aOSProductCategory.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: and<AOSProductCategory>([
      {forMarketPlace: true},
      {OR: [{archived: false}, {archived: null}]},
      where,
    ]),
    select: {
      id: true,
      name: true,
      colorTheme: true,
      iconCode: true,
    },
  });

  return categories;
}

export async function findProductCategory(
  categoryId: ID,
  client: Client,
) {
  const category = await client.aOSProductCategory.findOne({
    where: {
      id: categoryId,
      forMarketPlace: true,
      OR: [{archived: false}, {archived: null}],
    },
    select: {
      id: true,
      name: true,
      colorTheme: true,
      iconCode: true,
    },
  });

  return category;
}

// ---- PRODUCTS ---- //

export async function findProducts(
  client: Client,
  props?: QueryProps<AOSProduct>,
) {
  const {where, take, skip, orderBy} = props ?? {};

  const products = await client.aOSProduct.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: and<AOSProduct>([
      {isMarketPlace: true},
      {OR: [{archived: false}, {archived: null}]},
      where,
    ]),
    select: {
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
      currentVersion: {
        id: true,
        versionNumber: true,
      },
    },
  });

  return products;
}

export async function findProduct(
  slug: string,
  client: Client,
) {
  const product = await client.aOSProduct.findOne({
    where: {
      slug,
      isMarketPlace: true,
      OR: [{archived: false}, {archived: null}],
    },
    select: {
      id: true,
      name: true,
      description: true,
      code: true,
      slug: true,
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
      currentVersion: {
        id: true,
        versionNumber: true,
        statusSelect: true,
        changelog: true,
        dateOfApproval: true,
      },
      productCategory: {
        id: true,
        name: true,
      },
      portalCategorySet: {
        select: {id: true, name: true},
      },
    },
  });

  return product;
}

// ---- CREATE PRODUCT ---- //

export async function createProduct(
  client: Client,
  data: {
    name: string;
    code: string;
    description?: string | null;
    marketplaceTypeSelect?: string | null;
    marketplaceCoverStyle?: string | null;
    marketplaceIconCode?: string | null;
    documentationUrl?: string | null;
    supportIssuesUrl?: string | null;
    supportContactUrl?: string | null;
  },
) {
  const product = await client.aOSProduct.create({
    data: {
      ...data,
      isMarketPlace: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  return product;
}

// ---- UPDATE PRODUCT ---- //

export async function updateProduct(
  client: Client,
  data: {
    id: ID;
    version: number;
    name?: string;
    code?: string;
    description?: string | null;
    marketplaceTypeSelect?: string | null;
    marketplaceCoverStyle?: string | null;
    marketplaceIconCode?: string | null;
    documentationUrl?: string | null;
    supportIssuesUrl?: string | null;
    supportContactUrl?: string | null;
  },
) {
  const product = await client.aOSProduct.update({
    data,
    select: {
      id: true,
      name: true,
      code: true,
      version: true,
    },
  });

  return product;
}
