import type {
  AOSMarketplaceProductVersion,
  AOSProduct,
  AOSProductCategory,
} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {and, or} from '@/utils/orm';
import type {
  Entity,
  OrderByArg,
  SelectOptions,
  WhereOptions,
} from '@goovee/orm';
import {MARKETPLACE_VERSION_STATUS} from '../constants/statuses';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {type PriceComputeInput} from '../utils/price';

export type QueryProps<T extends Entity> = {
  where?: WhereOptions<T> | null;
  take?: number;
  orderBy?: OrderByArg<T> | null;
  skip?: number;
};

export function getProductAccessFilter(workspace: PortalWorkspaceWithConfig) {
  const where = and<AOSProduct>([
    {OR: [{archived: false}, {archived: null}]},
    {isMarketPlace: true},
    {portalWorkspace: {id: workspace.id}},
    {OR: [{isPrivate: false}, {isPrivate: null}]},
  ]);
  return where;
}

export function withProductAccessFilter(workspace: PortalWorkspaceWithConfig) {
  return function (where?: WhereOptions<AOSProduct>) {
    return and<AOSProduct>([where, getProductAccessFilter(workspace)]);
  };
}

export function getPublishedProductFilter(): WhereOptions<AOSProduct> {
  return {
    versionList: {statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED},
  };
}

export function withPublishedProductFilter(
  workspace: PortalWorkspaceWithConfig,
) {
  return function (where?: WhereOptions<AOSProduct>) {
    return and<AOSProduct>([
      where,
      getProductAccessFilter(workspace),
      getPublishedProductFilter(),
    ]);
  };
}

export function getCategoryAccessFilter(workspace: PortalWorkspaceWithConfig) {
  const where = and<AOSProductCategory>([
    {forMarketPlace: true},
    {OR: [{archived: false}, {archived: null}]},
    {portalWorkspace: {id: workspace.id}},
  ]);
  return where;
}

export function withCategoryAccessFilter(workspace: PortalWorkspaceWithConfig) {
  return function (where?: WhereOptions<AOSProductCategory>) {
    return and<AOSProductCategory>([where, getCategoryAccessFilter(workspace)]);
  };
}

export function getMyProductAccessFilter(
  workspace: PortalWorkspaceWithConfig,
  partnerId: ID,
) {
  const where = and<AOSProduct>([
    {defaultSupplierPartner: {id: partnerId}},
    getProductAccessFilter(workspace),
  ]);
  return where;
}

export function withMyProductAccessFilter(
  workspace: PortalWorkspaceWithConfig,
  partnerId: ID,
) {
  return function (where?: WhereOptions<AOSProduct>) {
    return and<AOSProduct>([
      where,
      getMyProductAccessFilter(workspace, partnerId),
    ]);
  };
}

/**
 * Restricts a version query to bundles the caller is allowed to download.
 * Branches the caller can satisfy:
 *   - **Owner** of the product → any version, any status (delegated to
 *     {@link getMyProductAccessFilter}).
 *   - **Free + published** — `salePrice` ≤ 0 (or null) on the product.
 *   - **Paid + owned + published** — a MarketplaceProductPurchase row
 *     exists for the caller's partner on this product.
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
      {product: {id: productId}},
      or<AOSMarketplaceProductVersion>([
        // Free + published. `salePrice <= 0` excludes NULL in SQL, so
        // the null branch is included explicitly for legacy / admin-
        // edited products that never had a price set.
        {
          statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
          product: and([
            productAccess,
            {OR: [{salePrice: {le: 0}}, {salePrice: null}]},
          ]),
        },
        // Paid + owned + published
        mainPartnerId && {
          statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
          product: and([
            productAccess,
            {marketplaceProductPurchaseList: {partner: {id: mainPartnerId}}},
          ]),
        },
        // Owner — any status
        mainPartnerId && {
          product: getMyProductAccessFilter(workspace, mainPartnerId),
        },
      ]),
    ]);
  };
}

/** Default goovee-orm result shape for lookups that select only id+version. */
export type ORMRecord = {id: string; version: number};

/* Each query that returns a product enriches the row with `price`
 * (wt / ati / taxRate / currency) computed server-side via the same logic
 * AOS Java uses when generating invoice lines. Consumers should read these
 * numbers and never recompute on the client. */
export type PriceableProduct = PriceComputeInput & {
  saleCurrency?: {
    code?: string | null;
    symbol?: string | null;
    numberOfDecimals?: number | null;
  } | null;
};

/** Fields every product query must select to enable price computation.
 *  Exported so cart-validation and other call sites can spread it into
 *  their selects and stay in lockstep with whatever `computePrice` reads. */
export const priceSelectFields = {
  salePrice: true,
  saleCurrency: {code: true, symbol: true, numberOfDecimals: true},
  inAti: true,
  productCompanyList: {
    select: {
      company: {id: true},
      salePrice: true,
      inAti: true,
    },
  },
  accountManagementList: {
    select: {
      id: true,
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
    },
  },
  productFamily: {
    accountManagementList: {
      select: {
        id: true,
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
      },
    },
  },
} as const satisfies SelectOptions<AOSProduct>;
