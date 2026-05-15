import type {
  Entity,
  OrderByArg,
  WhereOptions,
  Payload,
  SelectOptions,
} from '@goovee/orm';
import type {Client} from '@/goovee/.generated/client';
import type {
  AOSProduct,
  AOSProductCategory,
  AOSMarketplaceReview,
  AOSMarketplaceProductVersion,
} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {and} from '@/utils/orm';
import {MARKETPLACE_VERSION_STATUS} from '../constant/statuses';
import {withProductAccessFilter, withCategoryAccessFilter} from './helpers';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';

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
export type ListCategory = Awaited<
  ReturnType<typeof findProductCategories>
>[number];
export type ListReview = Awaited<ReturnType<typeof findProductReviews>>[number];

// ---- ACCESS CONTROL ---- //
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

// ---- PRODUCT CATEGORIES ---- //

export async function findProductCategories({
  client,
  workspace,
  where,
  take,
  skip,
  orderBy,
}: {
  client: Client;
  workspace: PortalWorkspaceWithConfig;
} & QueryProps<AOSProductCategory>) {
  const categories = await client.aOSProductCategory.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: withCategoryAccessFilter(workspace)({
      ...where,
    }),
    select: {
      id: true,
      name: true,
      colorTheme: true,
      iconCode: true,
    },
  });

  return categories;
}

export async function findProductCategory({
  categoryId,
  client,
  workspace,
}: {
  categoryId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
}) {
  const category = await client.aOSProductCategory.findOne({
    where: withCategoryAccessFilter(workspace)({
      id: categoryId,
    }),
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

export async function findProducts({
  client,
  workspace,
  where,
  take,
  skip,
  orderBy,
}: {
  client: Client;
  workspace: PortalWorkspaceWithConfig;
} & QueryProps<AOSProduct>) {
  const products = await client.aOSProduct.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: withProductAccessFilter(workspace)({
      ...where,
    }),
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

export async function findProduct({
  slug,
  client,
  workspace,
}: {
  slug: string;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
}) {
  const product = await client.aOSProduct.findOne({
    where: withProductAccessFilter(workspace)({
      slug,
    }),
    select: {
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
      currentVersion: {
        id: true,
        versionNumber: true,
        statusSelect: true,
        changelog: true,
        dateOfApproval: true,
        compatibilitySet: {
          select: {
            title: true,
          },
          orderBy: {
            releasedOn: 'DESC',
          },
        },
      },
      productCategory: {
        id: true,
        name: true,
      },
      defaultSupplierPartner: {
        id: true,
        simpleFullName: true,
        name: true,
        picture: {id: true},
      },
      portalCategorySet: {
        select: {id: true, name: true},
      },
      portalImageList: {
        select: {picture: {id: true}},
      },
    },
  });

  return product;
}

// ---- PRODUCT VERSIONS ---- //

export async function findProductVersions({
  productId,
  client,
  where,
  take,
  skip,
  orderBy,
}: {
  productId: ID;
  client: Client;
} & QueryProps<AOSMarketplaceProductVersion>) {
  const versions = await client.aOSMarketplaceProductVersion.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: and<AOSMarketplaceProductVersion>([
      {product: {id: productId}},
      {statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED},
      where,
    ]),
    select: {
      id: true,
      versionNumber: true,
      dateOfApproval: true,
      changelog: true,
      statusSelect: true,
      bundleFile: {id: true},
      compatibilitySet: {
        select: {
          title: true,
        },
        orderBy: {
          releasedOn: 'DESC',
        },
      },
    },
    orderBy: {dateOfApproval: 'DESC'},
  });

  return versions;
}

export type ListProductVersion = Awaited<
  ReturnType<typeof findProductVersions>
>[number];

// ---- PRODUCT REVIEWS ---- //

export async function findProductReviews({
  productId,
  client,
  where,
  take,
  skip,
  orderBy,
}: {
  productId: ID;
  client: Client;
} & QueryProps<AOSMarketplaceReview>) {
  const reviews = await client.aOSMarketplaceReview.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: and<AOSMarketplaceReview>([{product: {id: productId}}, where]),
    select: {
      id: true,
      rating: true,
      reviewComment: true,
      createdOn: true,
      author: {
        id: true,
        simpleFullName: true,
        picture: {id: true},
      },
      reviewedVersion: {
        id: true,
        versionNumber: true,
      },
    },
    orderBy: {createdOn: 'DESC'},
  });

  return reviews;
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
