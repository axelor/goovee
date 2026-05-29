import type {
  AOSAccountManagement,
  AOSMarketplaceProduct,
  AOSMarketplaceCategory,
  AOSMarketplaceProductVersion,
  AOSProduct,
  AOSCurrency,
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
    versionList: {statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED},
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

export function getCategoryAccessFilter(_workspace: PortalWorkspaceWithConfig) {
  return and<AOSMarketplaceCategory>([
    {OR: [{archived: false}, {archived: null}]},
  ]);
}

export function withCategoryAccessFilter(workspace: PortalWorkspaceWithConfig) {
  return function (where?: WhereOptions<AOSMarketplaceCategory>) {
    return and<AOSMarketplaceCategory>([
      where,
      getCategoryAccessFilter(workspace),
    ]);
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

export const currencySelect = {
  code: true,
  symbol: true,
  numberOfDecimals: true,
} as const satisfies SelectOptions<AOSCurrency>;

export type Currency = Payload<AOSCurrency, {select: typeof currencySelect}>;

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

const accountManagementSelectFields = {
  company: {id: true},
  saleTaxSet: {
    select: {
      id: true,
      activeTaxLine: {value: true},
      taxLineList: {
        select: {value: true, startDate: true, endDate: true},
      },
    },
  },
} as const satisfies SelectOptions<AOSAccountManagement>;

/** One row from `accountManagementList` — minimum fields needed for tax
 *  resolution. Defined at the leaf so it can be referenced both on the
 *  product and on the product family without redeclaring. */
export type AccountManagementRow = Payload<
  AOSAccountManagement,
  {select: typeof accountManagementSelectFields}
>;

/** Fields the backing real `Product` must expose for tax/currency
 *  resolution. Used by `computePrice` directly. */
const productPriceSelectFields = {
  salePrice: true,
  inAti: true,
  saleCurrency: currencySelect,
  /* Per-company overrides of `salePrice` / `inAti` / `saleCurrency`. AOS
   * reads these via `ProductCompanyService` before falling back to the
   * base product fields. */
  productCompanyList: {
    select: {
      company: {id: true},
      salePrice: true,
      inAti: true,
      saleCurrency: currencySelect,
    },
  },
  /* Product-level account-management overrides. AOS consults these
   * before falling back to the product family's list. */
  accountManagementList: {select: accountManagementSelectFields},
  productFamily: {
    accountManagementList: {select: accountManagementSelectFields},
  },
} as const satisfies SelectOptions<AOSProduct>;

export type PriceableProduct = Payload<
  AOSProduct,
  {select: typeof productPriceSelectFields}
>;

/** Fields the MP listing must expose for `withPrice` to compute the
 *  server-side `price` (wt / ati / taxRate / currency). The listing's
 *  price-defining fields layer on top of the backing product's via
 *  `priceOverride` — see `withPrice`. Consumers should read the
 *  computed `price` and never recompute on the client. */
export const priceSelectFields = {
  salePrice: true,
  inAti: true,
  saleCurrency: {id: true, code: true, symbol: true, numberOfDecimals: true},
  product: productPriceSelectFields,
} as const satisfies SelectOptions<AOSMarketplaceProduct>;

export type PriceableMarketplaceProduct = Payload<
  AOSMarketplaceProduct,
  {select: typeof priceSelectFields}
>;
