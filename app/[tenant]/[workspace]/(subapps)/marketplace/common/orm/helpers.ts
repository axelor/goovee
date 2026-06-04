import type {
  AOSMarketplaceProduct,
  AOSMarketplaceCategory,
  AOSMarketplaceProductVersion,
} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {and, or} from '@/utils/orm';
import type {
  Entity,
  OrderByArg,
  Payload,
  SelectOptions,
  WhereOptions,
} from '@goovee/orm';
import {MARKETPLACE_VERSION_STATUS} from '../constants/statuses';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {Maybe} from '@/types/util';
import {productPriceSelectFields} from '@/product/orm';

export type QueryProps<T extends Entity> = {
  where?: WhereOptions<T> | null;
  take?: number;
  orderBy?: OrderByArg<T> | null;
  skip?: number;
};

export function getProductAccessFilter(workspace: PortalWorkspaceWithConfig) {
  return and<AOSMarketplaceProduct>([
    {OR: [{archived: false}, {archived: null}]},
    {portalWorkspace: {id: workspace.id}},
  ]);
}

export function withProductAccessFilter(workspace: PortalWorkspaceWithConfig) {
  return function (where?: WhereOptions<AOSMarketplaceProduct>) {
    return and<AOSMarketplaceProduct>([
      where,
      getProductAccessFilter(workspace),
    ]);
  };
}

export function getPublishedProductFilter(): WhereOptions<AOSMarketplaceProduct> {
  return {
    versionList: {
      statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
      OR: [{archived: false}, {archived: null}],
    },
  };
}

export function withPublishedProductFilter(
  workspace: PortalWorkspaceWithConfig,
) {
  return function (where?: WhereOptions<AOSMarketplaceProduct>) {
    return and<AOSMarketplaceProduct>([
      where,
      getProductAccessFilter(workspace),
      getPublishedProductFilter(),
    ]);
  };
}

export function getCategoryAccessFilter(): WhereOptions<AOSMarketplaceCategory> {
  return {OR: [{archived: false}, {archived: null}]};
}

export function withCategoryAccessFilter() {
  return function (where?: WhereOptions<AOSMarketplaceCategory>) {
    return and<AOSMarketplaceCategory>([where, getCategoryAccessFilter()]);
  };
}

export function getMyProductAccessFilter(
  workspace: PortalWorkspaceWithConfig,
  partnerId: ID,
) {
  return and<AOSMarketplaceProduct>([
    {publisher: {id: partnerId}},
    getProductAccessFilter(workspace),
  ]);
}

export function withMyProductAccessFilter(
  workspace: PortalWorkspaceWithConfig,
  partnerId: ID,
) {
  return function (where?: WhereOptions<AOSMarketplaceProduct>) {
    return and<AOSMarketplaceProduct>([
      where,
      getMyProductAccessFilter(workspace, partnerId),
    ]);
  };
}

/**
 * Restricts a version query to bundles the caller is allowed to download.
 * Branches the caller can satisfy:
 *   - **Owner** of the marketplace product (publisher) → any version, any
 *     status (delegated to {@link getMyProductAccessFilter}).
 *   - **Free + published** — `salePrice` ≤ 0 (or null) on the product.
 *   - **Paid + owned + published** — a MarketplaceProductPurchase row
 *     exists for the caller's partner on this marketplace product.
 *
 * Single query, no pre-fetch. Non-owner non-purchaser callers of paid
 * products never match.
 */
export function withBundleAccessFilter({
  workspace,
  mainPartnerId,
  productId,
}: {
  workspace: PortalWorkspaceWithConfig;
  mainPartnerId?: ID;
  productId: ID;
}) {
  return function (where?: WhereOptions<AOSMarketplaceProductVersion>) {
    const productAccess = getProductAccessFilter(workspace);
    return and<AOSMarketplaceProductVersion>([
      where,
      {OR: [{archived: false}, {archived: null}]},
      {marketplaceProduct: {id: productId}},
      or<AOSMarketplaceProductVersion>([
        // Free + published. `salePrice <= 0` excludes NULL in SQL, so
        // the null branch is included explicitly for legacy / admin-
        // edited products that never had a price set.
        {
          statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
          marketplaceProduct: and<AOSMarketplaceProduct>([
            productAccess,
            {OR: [{salePrice: {le: 0}}, {salePrice: null}]},
          ]),
        },
        // Paid + owned + published — purchaseList is the o2m back-ref
        // on MarketplaceProduct from MarketplaceProductPurchase.
        mainPartnerId && {
          statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
          marketplaceProduct: and<AOSMarketplaceProduct>([
            productAccess,
            {purchaseList: {partner: {id: mainPartnerId}}},
          ]),
        },
        // Owner (publisher) — any status
        mainPartnerId && {
          marketplaceProduct: getMyProductAccessFilter(
            workspace,
            mainPartnerId,
          ),
        },
      ]),
    ]);
  };
}

export function withScreenshotAccessFilter(
  workspace: PortalWorkspaceWithConfig,
  mainPartnerId: Maybe<ID>,
) {
  return function (where?: WhereOptions<AOSMarketplaceProduct>) {
    return and<AOSMarketplaceProduct>([
      where,
      or<AOSMarketplaceProduct>([
        // must be owned by the caller
        mainPartnerId && withMyProductAccessFilter(workspace, mainPartnerId)(),
        // or published
        withPublishedProductFilter(workspace)(),
      ]),
    ]);
  };
}

/* Canonical ordering for version listings: highest sort tuple first.
 * vPreRelease NULLs sort ABOVE tags on DESC so `1.2.3` > `1.2.3-rc2`. */
export const versionSortOrder = {
  vMajor: 'DESC',
  vMinor: 'DESC',
  vPatch: 'DESC',
  vPreRelease: 'DESC',
} as const satisfies OrderByArg<AOSMarketplaceProductVersion>;

/* Shared fragment for selecting the four parsed-version columns. Callers
 * pair this with `formatVersionNumber` to render the display string. */
export const versionNumberFields = {
  vMajor: true,
  vMinor: true,
  vPatch: true,
  vPreRelease: true,
} as const satisfies SelectOptions<AOSMarketplaceProductVersion>;

/** Default goovee-orm result shape for lookups that select only id+version. */
export type ORMRecord = {id: string; version: number};

/** Fields the MP listing must expose for `withPrice` to compute the
 *  server-side `price` (wt / ati / taxRate / currency). The listing's
 *  price-defining fields layer on top of the workspace default
 *  product's via `priceOverride` — see `withPrice`. Consumers should read the
 *  computed `price` and never recompute on the client. */
export const priceSelectFields = {
  salePrice: true,
  inAti: true,
  saleCurrency: {
    id: true,
    code: true,
    codeISO: true,
    symbol: true,
    numberOfDecimals: true,
  },
  product: productPriceSelectFields,
} as const satisfies SelectOptions<AOSMarketplaceProduct>;

export type PriceableMarketplaceProduct = Payload<
  AOSMarketplaceProduct,
  {select: typeof priceSelectFields}
>;
