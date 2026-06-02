import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceProduct} from '@/goovee/.generated/models';
import {ID} from '@/types';
import {and, or} from '@/utils/orm';
import type {Payload, SelectOptions} from '@goovee/orm';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {slugify} from '../utils/slugify';
import {
  priceSelectFields,
  versionNumberFields,
  withMyProductAccessFilter,
  withProductAccessFilter,
  withPublishedProductFilter,
  withScreenshotAccessFilter,
  type QueryProps,
} from './helpers';
import {buildPriceContext, withPrice} from './price';
import {Maybe} from '@/types/util';

// ---- PRODUCTS ---- //

export async function findProductAccess<
  T extends SelectOptions<AOSMarketplaceProduct>,
>({
  recordId: productId,
  client,
  workspace,
  select,
}: {
  recordId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  select?: T;
}): Promise<Payload<AOSMarketplaceProduct, {select: T}> | null> {
  return client.aOSMarketplaceProduct.findOne({
    where: withProductAccessFilter(workspace)({id: productId}),
    select: select as T,
  });
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
  return client.aOSMarketplaceProduct.find({
    take,
    where: withPublishedProductFilter(workspace)(
      and<AOSMarketplaceProduct>([
        type ? {marketplaceTypeSelect: type} : undefined,
        or<AOSMarketplaceProduct>([
          {name: {like: pattern}},
          {description: {like: pattern}},
        ]),
      ]),
    ),
    select: {
      id: true,
      slug: true,
      name: true,
      iconCode: true,
      coverStyle: true,
      marketplaceTypeSelect: true,
    },
  });
}

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
} & QueryProps<AOSMarketplaceProduct>) {
  const products = await client.aOSMarketplaceProduct.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: withPublishedProductFilter(workspace)({...where}),
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
      currentVersion: {id: true, ...versionNumberFields},
    },
  });
  const priceContext = await buildPriceContext({
    client,
    mainPartnerId,
    productCurrencyCodes: products.map(
      p => p.saleCurrency?.code ?? p.product?.saleCurrency?.code,
    ),
  });

  return products.map(p => withPrice(p, workspace, priceContext));
}

export type SingleProduct = NonNullable<
  Awaited<ReturnType<typeof findProduct>>
>;

export async function findProduct({
  slug,
  client,
  workspace,
  mainPartnerId,
  preview = false,
}: {
  slug: string;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  mainPartnerId?: string | null;
  /* Owner-only preview of an unpublished product: drop the published
   * filter and scope strictly to the caller's own products instead. */
  preview?: boolean;
}) {
  // Nothing to preview without a known partner to scope ownership to.
  if (preview && !mainPartnerId) return null;

  const versionDetailSelect = {
    id: true,
    ...versionNumberFields,
    statusSelect: true,
    changelog: true,
    dateOfPublish: true,
    bundleFile: {sizeText: true},
    compatibilitySet: {
      select: {title: true},
      orderBy: {releasedOn: 'DESC'},
    },
  } as const;

  const product = await client.aOSMarketplaceProduct.findOne({
    where:
      preview && mainPartnerId
        ? withMyProductAccessFilter(workspace, mainPartnerId)({slug})
        : withPublishedProductFilter(workspace)({slug}),
    select: {
      id: true,
      name: true,
      description: true,
      longDescription: true,
      slug: true,
      createdOn: true,
      marketplaceTypeSelect: true,
      coverStyle: true,
      iconCode: true,
      documentationUrl: true,
      supportIssuesUrl: true,
      supportContactUrl: true,
      averageRating: true,
      ratingCount: true,
      installCount: true,
      ...priceSelectFields,
      currentVersion: versionDetailSelect,
      latestVersion: versionDetailSelect,
      categorySet: {select: {id: true, name: true}},
      license: {
        id: true,
        name: true,
        url: true,
      },
      publisher: {
        id: true,
        simpleFullName: true,
        name: true,
        picture: {id: true},
      },
      pictureList: {
        select: {sequence: true, picture: {id: true}},
        orderBy: {sequence: 'ASC'},
      },
    },
  });
  if (!product) return null;
  // In preview, surface the latest version through `currentVersion` so the
  // page's version-specific sections render without special-casing.
  const resolved =
    preview && !product.currentVersion
      ? {...product, currentVersion: product.latestVersion}
      : product;
  const priceContext = await buildPriceContext({
    client,
    mainPartnerId,
    productCurrencyCodes: [
      resolved.saleCurrency?.code ?? resolved.product?.saleCurrency?.code,
    ],
  });
  return withPrice(resolved, workspace, priceContext);
}

/**
 * Slug for a new product, unique within its workspace. Matches the
 * `(portalWorkspace, slug)` DB unique constraint: when `slugify(name)` is
 * already taken in the workspace, appends the lowest free numeric suffix
 * (`my-product`, `my-product-2`, `my-product-3`, …).
 *
 * The existence check intentionally omits the archived filter — the DB
 * constraint covers archived rows too, so their slugs are still reserved
 * even though routing hides them.
 *
 * Best-effort: a concurrent create of the same name can still lose the
 * race and hit the constraint at insert. That rare case surfaces through
 * the caller's normal error path; we don't retry here.
 */
export async function generateUniqueProductSlug({
  client,
  workspaceId,
  name,
}: {
  client: Client;
  workspaceId: ID;
  name: string;
}): Promise<string> {
  const base = slugify(name);
  const rows = await client.aOSMarketplaceProduct.find({
    where: {
      portalWorkspace: {id: workspaceId},
      OR: [{slug: base}, {slug: {like: `${base}-%`}}],
    },
    select: {slug: true},
  });
  const taken = new Set(rows.map(r => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * Resolves a single screenshot metafile for a marketplace product, in one
 * access-checked query: the product must pass {@link withScreenshotAccessFilter}
 * AND own a picture pointing at `fileId`.
 * Returns the picture's metafile (its id) or null. Used by the marketplace
 * image route to stream the file only when the caller may see the product.
 */
export async function getProductScreenshot({
  client,
  workspace,
  productId,
  fileId,
  mainPartnerId,
}: {
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  productId: ID;
  fileId: ID;
  mainPartnerId: Maybe<ID>;
}) {
  const product = await client.aOSMarketplaceProduct.findOne({
    where: withScreenshotAccessFilter(
      workspace,
      mainPartnerId,
    )({
      id: productId,
      pictureList: {picture: {id: fileId}},
    }),
    select: {
      pictureList: {
        where: {picture: {id: fileId}},
        select: {picture: {id: true}},
      },
    },
  });
  return product?.pictureList?.[0]?.picture ?? null;
}
