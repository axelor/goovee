import type {
  AOSProduct,
  AOSProductCategory,
  AOSMarketplaceProductVersion,
} from '@/goovee/.generated/models';
import type {Entity, OrderByArg, WhereOptions} from '@goovee/orm';
import type {ID} from '@/types';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {and, or} from '@/utils/orm';
import {MARKETPLACE_VERSION_STATUS} from '../constant/statuses';

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
  userId: ID,
) {
  const where = and<AOSProduct>([
    {defaultSupplierPartner: {id: userId}},
    getProductAccessFilter(workspace),
  ]);
  return where;
}

export function withMyProductAccessFilter(
  workspace: PortalWorkspaceWithConfig,
  userId: ID,
) {
  return function (where?: WhereOptions<AOSProduct>) {
    return and<AOSProduct>([
      where,
      getMyProductAccessFilter(workspace, userId),
    ]);
  };
}

/**
 * Restricts a version query to bundles the caller is allowed to download.
 * Anyone in the workspace can download published versions; the product
 * owner can additionally download their own drafts. Owner access is
 * delegated to {@link getMyProductAccessFilter} so any future rules on
 * my-product access apply here automatically.
 */
export function withBundleAccessFilter({
  workspace,
  userId,
  productId,
}: {
  workspace: PortalWorkspaceWithConfig;
  userId?: ID;
  productId: ID;
}) {
  return function (where?: WhereOptions<AOSMarketplaceProductVersion>) {
    return and<AOSMarketplaceProductVersion>([
      where,
      {product: {id: productId}},
      or<AOSMarketplaceProductVersion>([
        {
          statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
          product: getProductAccessFilter(workspace),
        },
        userId && {product: getMyProductAccessFilter(workspace, userId)},
      ]),
    ]);
  };
}
