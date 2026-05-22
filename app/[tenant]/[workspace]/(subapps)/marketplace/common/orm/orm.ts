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
  AOSMarketplaceProductPurchase,
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
import {DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_SCALE} from '@/constants';
import {sql} from '@/utils/template-string';
import {
  computePrice,
  type ComputedPrice,
  type PriceComputeInput,
  type ConversionLine,
  type CurrencyInput,
} from '../utils/price';
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

/* Each query that returns a product enriches the row with `price`
 * (wt / ati / taxRate / currency) computed server-side via the same logic
 * AOS Java uses when generating invoice lines. Consumers should read these
 * numbers and never recompute on the client. */
type PriceableProduct = PriceComputeInput & {
  saleCurrency?: {
    code?: string | null;
    symbol?: string | null;
    numberOfDecimals?: number | null;
  } | null;
};

/** Fields every product query must select to enable price computation. */
const priceSelectFields = {
  salePrice: true,
  saleCurrency: {code: true, symbol: true, numberOfDecimals: true},
  inAti: true,
  accountManagementList: {
    select: {
      id: true,
      company: {id: true},
      saleTaxSet: {
        select: {
          activeTaxLine: {value: true},
          taxLineList: {
            select: {value: true, startDate: true, endDate: true},
          },
        },
      },
    },
  },
  productFamily: {
    accountManagementList: {
      select: {
        id: true,
        company: {id: true},
        saleTaxSet: {
          select: {activeTaxLine: {value: true}},
        },
      },
    },
  },
} as const satisfies SelectOptions<AOSProduct>;

export type PriceContext = {
  conversionLines: ConversionLine[];
  viewerCurrency: CurrencyInput | null;
  defaultCurrency: CurrencyInput | null;
};

function toCurrencyInput(
  c:
    | {
        code?: string | null;
        symbol?: string | null;
        numberOfDecimals?: number | null;
      }
    | null
    | undefined,
): CurrencyInput | null {
  if (!c?.code) return null;
  return {
    code: c.code,
    symbol: c.symbol ?? '',
    numberOfDecimals: c.numberOfDecimals,
  };
}

function withPrice<T extends PriceableProduct>(
  product: T,
  workspace: PortalWorkspaceWithConfig,
  priceContext: PriceContext,
): T & {price: ComputedPrice} {
  const productCurrency = toCurrencyInput(product.saleCurrency);
  return {
    ...product,
    price: computePrice(product, {
      companyId: workspace.config.company?.id,
      companyTimezone: workspace.config.company?.timezone,
      scale: product.saleCurrency?.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE,
      productCurrency,
      viewerCurrency: priceContext.viewerCurrency,
      defaultCurrency: priceContext.defaultCurrency,
      conversionLines: priceContext.conversionLines,
    }),
  };
}

/** Fetches the conversion lines needed to convert between the given
 *  product currencies and any of the conversion targets (viewer +
 *  default). Filters the query to just the relevant (from, to) pairs
 *  (in both directions) so we don't pull the entire table. Returns
 *  empty when there's nothing to convert. */
export async function fetchConversionLines({
  client,
  fromCodes,
  toCodes,
}: {
  client: Client;
  fromCodes: Array<string | null | undefined>;
  toCodes: Array<string | null | undefined>;
}): Promise<ConversionLine[]> {
  const tos = Array.from(
    new Set(
      toCodes.filter((c): c is string => typeof c === 'string' && c.length > 0),
    ),
  );
  if (tos.length === 0) return [];
  const froms = Array.from(
    new Set(
      fromCodes.filter(
        (c): c is string =>
          typeof c === 'string' && c.length > 0 && !tos.includes(c),
      ),
    ),
  );
  if (froms.length === 0) return [];

  const appBase = await client.aOSAppBase.findOne({
    where: {archived: {ne: true}},
    select: {
      currencyConversionLineList: {
        where: {
          OR: [
            {
              startCurrency: {code: {in: froms}},
              endCurrency: {code: {in: tos}},
            },
            {
              startCurrency: {code: {in: tos}},
              endCurrency: {code: {in: froms}},
            },
          ],
        },
        select: {
          startCurrency: {code: true},
          endCurrency: {code: true},
          exchangeRate: true,
          fromDate: true,
          toDate: true,
        },
      },
    },
  });
  return appBase?.currencyConversionLineList ?? [];
}

/** Builds the PriceContext for a batch of products: resolves the viewer
 *  and default currencies, then fetches only the conversion lines
 *  between the product currencies present in the batch and either
 *  target. `computePrice` applies the three-step fallback (viewer →
 *  default → product). */
export async function buildPriceContext({
  client,
  mainPartnerId,
  productCurrencyCodes,
}: {
  client: Client;
  mainPartnerId: string | null | undefined;
  productCurrencyCodes: Array<string | null | undefined>;
}): Promise<PriceContext> {
  const [partner, fallback] = await Promise.all([
    findPartnerCurrency({client, mainPartnerId}),
    findDefaultCurrency(client),
  ]);
  const viewerCurrency = toCurrencyInput(partner);
  const defaultCurrency = toCurrencyInput(fallback);
  const conversionLines = await fetchConversionLines({
    client,
    fromCodes: productCurrencyCodes,
    toCodes: [viewerCurrency?.code, defaultCurrency?.code],
  });
  return {conversionLines, viewerCurrency, defaultCurrency};
}

/** Looks up the app-wide fallback currency (`DEFAULT_CURRENCY_CODE`) in
 *  `AOSCurrency`. Used at product create time (`saveProduct`) and at
 *  display time (`buildPriceContext`). Returns null if the row is missing
 *  — callers decide whether that's a hard failure (create) or a soft
 *  fallback (display). */
export async function findDefaultCurrency(client: Client) {
  return client.aOSCurrency.findOne({
    where: {code: DEFAULT_CURRENCY_CODE},
    select: {id: true, code: true, symbol: true, numberOfDecimals: true},
  });
}

export async function findPartnerCurrency({
  client,
  mainPartnerId,
}: {
  client: Client;
  mainPartnerId: string | null | undefined;
}) {
  if (!mainPartnerId) return null;
  const partner = await client.aOSPartner.findOne({
    where: {id: mainPartnerId},
    select: {
      currency: {id: true, code: true, symbol: true, numberOfDecimals: true},
    },
  });
  return partner?.currency ?? null;
}

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

export type ListMyProduct = Awaited<ReturnType<typeof findMyProducts>>[number];

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

// ---- BUNDLE UPLOAD ---- //

/* Streams an uploaded file to the tenant's storage directory and creates
 * the matching `aOSMetaFile` row. Returns the new file id. */
async function uploadFile(file: File, storage: string, client: Client) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
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
        fileType: file.type || 'application/octet-stream',
        fileSize: String(file.size),
        sizeText: getFileSizeText(file.size),
        description: '',
      },
      select: {id: true},
    })
    .then(clone);
  return meta.id;
}

/* Reconciles a product's screenshot list against the form submission:
 *   - Deletes any AOSProductPicture rows whose ids aren't in `keepImageIds`.
 *   - Uploads each file in `newImages` as a MetaFile + creates a fresh
 *     AOSProductPicture linked to the product.
 * Called from saveProduct after the product row exists. The form-level
 * cap (10 images / 5 MB each) has already been enforced by Zod. */
export async function syncProductImages({
  client,
  productId,
  storage,
  keepImageIds,
  newImages,
}: {
  client: Client;
  productId: string;
  storage: string;
  keepImageIds: string[];
  newImages: File[];
}) {
  const existing = await client.aOSProductPicture.find({
    where: {product: {id: productId}},
    select: {id: true, picture: {id: true}},
  });
  const keep = new Set(keepImageIds);
  const toDelete = existing.filter(row => !keep.has(row.id));
  if (toDelete.length) {
    await client.aOSProductPicture.deleteAll({
      where: {id: {in: toDelete.map(row => row.id)}},
    });
  }
  for (const file of newImages) {
    const metaId = await uploadFile(file, storage, client);
    await client.aOSProductPicture.create({
      data: {
        product: {select: {id: productId}},
        picture: {select: {id: metaId}},
      },
      select: {id: true},
    });
  }
}

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

// ---- PURCHASES / OWNERSHIP ---- //

/* Marketplace ownership records. The unique (partner, product) constraint
 * on the AOS side makes `recordPurchases` and `attachInvoiceToPurchases`
 * idempotent — safe to retry from the success page or a backfill job.
 *
 * The `invoice` field is nullable: the goovee tx writes the access row
 * immediately, and the post-commit AOS HTTP call back-attaches the
 * invoice id once the SO/Invoice/InvoicePayment have been created. See
 * docs/marketplace-checkout-plan.md for the full rationale. */

export async function findPurchases({
  client,
  mainPartnerId,
  take,
  skip,
}: {
  client: Client;
  mainPartnerId: ID | null | undefined;
} & Pick<QueryProps<AOSMarketplaceProductPurchase>, 'take' | 'skip'>) {
  if (!mainPartnerId) return [];
  return client.aOSMarketplaceProductPurchase.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    where: {partner: {id: mainPartnerId}},
    orderBy: {purchasedAt: 'DESC'},
    select: {
      id: true,
      purchasedAt: true,
      product: {
        id: true,
        slug: true,
        name: true,
        description: true,
        marketplaceTypeSelect: true,
        marketplaceIconCode: true,
        marketplaceCoverStyle: true,
        currentVersion: {id: true, versionNumber: true},
      },
      invoice: {id: true, invoiceId: true},
    },
  });
}

export type MarketplacePurchase = Awaited<
  ReturnType<typeof findPurchases>
>[number];

export async function recordPurchases(
  client: Client,
  partnerId: ID,
  productIds: string[],
  invoiceId: ID | null = null,
) {
  if (!productIds.length) return;
  const existing = await client.aOSMarketplaceProductPurchase.find({
    where: {
      partner: {id: partnerId},
      product: {id: {in: productIds}},
    },
    select: {product: {id: true}},
  });
  const existingIds = new Set(
    existing.map(row => row.product?.id).filter(Boolean) as string[],
  );
  const missing = productIds.filter(id => !existingIds.has(id));
  const now = new Date();
  for (const productId of missing) {
    try {
      await client.aOSMarketplaceProductPurchase.create({
        data: {
          partner: {select: {id: partnerId}},
          product: {select: {id: productId}},
          ...(invoiceId ? {invoice: {select: {id: String(invoiceId)}}} : {}),
          purchasedAt: now,
        },
        select: {id: true},
      });
    } catch {
      /* Unique (partner, product) violation from a concurrent insert.
       * Already-owned is exactly the state we want, so swallow. */
    }
  }
}

export async function attachInvoiceToPurchases(
  client: Client,
  partnerId: ID,
  productIds: string[],
  invoiceId: ID,
) {
  if (!productIds.length) return;
  const rows = await client.aOSMarketplaceProductPurchase.find({
    where: {
      partner: {id: partnerId},
      product: {id: {in: productIds}},
      invoice: {id: null},
    },
    select: {id: true, version: true},
  });
  for (const row of rows) {
    await client.aOSMarketplaceProductPurchase.update({
      data: {
        id: row.id,
        version: row.version,
        invoice: {select: {id: String(invoiceId)}},
      },
      select: {id: true},
    });
  }
}
