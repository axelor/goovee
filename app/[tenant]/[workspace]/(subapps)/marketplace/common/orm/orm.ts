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
import fs from 'fs';
import path from 'path';
import {Readable} from 'stream';
import type {ReadableStream as NodeReadableStream} from 'stream/web';
import {pipeline} from 'stream/promises';
import {clone} from '@/utils';
import {getFileSizeText} from '@/utils/files';
import {and, or} from '@/utils/orm';
import {sql} from '@/utils/template-string';
import {MARKETPLACE_VERSION_STATUS} from '../constants/statuses';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import {
  withProductAccessFilter,
  withPublishedProductFilter,
  withCategoryAccessFilter,
  withMyProductAccessFilter,
} from './helpers';
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

export type ProductSearchResult = Awaited<
  ReturnType<typeof findProductsBySearch>
>[number];

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
    where: withPublishedProductFilter(workspace)({
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
    where: withPublishedProductFilter(workspace)({
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
        bundleFile: {
          sizeText: true,
        },
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

export async function findMyReview({
  productId,
  userId,
  client,
}: {
  productId: ID;
  userId: ID;
  client: Client;
}) {
  return client.aOSMarketplaceReview.findOne({
    where: {product: {id: productId}, author: {id: userId}},
    select: {
      id: true,
      version: true,
      rating: true,
      reviewComment: true,
      createdOn: true,
      updatedOn: true,
      author: {id: true, simpleFullName: true, picture: {id: true}},
      reviewedVersion: {id: true, versionNumber: true},
    },
  });
}

export type MyReview = NonNullable<Awaited<ReturnType<typeof findMyReview>>>;

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

// ---- MY PRODUCTS (USER CONTRIBUTIONS) ---- //

export async function findMyProducts({
  partnerId,
  client,
  workspace,
  type,
  where,
  take,
  skip,
  orderBy,
}: {
  partnerId: ID;
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
      partnerId,
    )(and<AOSProduct>([type && {marketplaceTypeSelect: type}, where])),
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
        statusSelect: true,
      },
    },
  });

  return products;
}

export type ListMyProduct = Awaited<ReturnType<typeof findMyProducts>>[number];

export async function findMyProductWithVersions({
  productId,
  partnerId,
  client,
  workspace,
}: {
  productId: ID;
  partnerId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
}) {
  const product = await client.aOSProduct.findOne({
    where: withMyProductAccessFilter(workspace, partnerId)({id: productId}),
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

export type MyProductWithVersions = NonNullable<
  Awaited<ReturnType<typeof findMyProductWithVersions>>
>;

export async function findCompatibilityVersions(client: Client) {
  return client.aOSMarketplaceAxelorVersion.find({
    select: {id: true, title: true, name: true, releasedOn: true},
    orderBy: {releasedOn: 'DESC'},
  });
}

export type CompatibilityVersion = Awaited<
  ReturnType<typeof findCompatibilityVersions>
>[number];

export async function countMyProducts({
  partnerId,
  client,
  workspace,
  type,
}: {
  partnerId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  type?: MARKETPLACE_TYPE;
}): Promise<number> {
  const count = await client.aOSProduct.count({
    where: withMyProductAccessFilter(
      workspace,
      partnerId,
    )(type && {marketplaceTypeSelect: type}),
  });

  return Number(count);
}

// ---- BUNDLE UPLOAD ---- //

/* Streams an uploaded `.zip` to the tenant's storage directory and creates
 * the matching `aOSMetaFile` row. Returns the new file id. */
export async function uploadBundle(
  file: File,
  storage: string,
  client: Client,
) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}-${safeName}`;
  await pipeline(
    Readable.fromWeb(
      file.stream() as unknown as NodeReadableStream<Uint8Array>,
    ),
    fs.createWriteStream(path.resolve(storage, fileName)),
  );
  const meta = await client.aOSMetaFile
    .create({
      data: {
        fileName: file.name,
        filePath: fileName,
        fileType: file.type || 'application/zip',
        fileSize: String(file.size),
        sizeText: getFileSizeText(file.size),
        description: '',
      },
      select: {id: true},
    })
    .then(clone);
  return meta.id;
}

// ---- PRODUCT RATING (incremental maintenance) ---- //

/* Each helper is a single raw-SQL UPDATE so the read and write of
 * (ratingCount, averageRating) happen atomically at the row-lock level —
 * no read-modify-write race — and the row's optimistic-lock `version`
 * column is left alone so concurrent product edits aren't disrupted.
 * Running-mean math accumulates rounding error over many edits; for star
 * ratings clamped to 1-5, drift stays within a tenth of a star. An
 * occasional full recompute job can correct it. */

export async function addRating(
  client: Client,
  productId: string,
  rating: number,
) {
  await client.$raw(
    sql`
      UPDATE base_product
      SET
        average_rating = (
          COALESCE(average_rating, 0) * COALESCE(rating_count, 0) + $2
        ) / (COALESCE(rating_count, 0) + 1),
        rating_count = COALESCE(rating_count, 0) + 1
      WHERE
        id = $1
    `,
    productId,
    rating,
  );
}

export async function replaceRating(
  client: Client,
  productId: string,
  oldRating: number,
  newRating: number,
) {
  if (oldRating === newRating) return;
  await client.$raw(
    sql`
      UPDATE base_product
      SET
        average_rating = average_rating + ($3 - $2)::numeric / NULLIF(rating_count, 0)
      WHERE
        id = $1
    `,
    productId,
    oldRating,
    newRating,
  );
}

export async function removeRating(
  client: Client,
  productId: string,
  oldRating: number,
) {
  await client.$raw(
    sql`
      UPDATE base_product
      SET
        average_rating = CASE
          WHEN rating_count <= 1 THEN 0
          ELSE (average_rating * rating_count - $2) / (rating_count - 1)
        END,
        rating_count = GREATEST(COALESCE(rating_count, 0) - 1, 0)
      WHERE
        id = $1
    `,
    productId,
    oldRating,
  );
}
