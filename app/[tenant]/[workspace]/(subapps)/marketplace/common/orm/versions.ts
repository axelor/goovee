import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceProductVersion} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {and} from '@/utils/orm';
import {MARKETPLACE_VERSION_STATUS} from '../constants/statuses';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {
  versionNumberFields,
  versionSortOrder,
  withBundleAccessFilter,
  withMyProductAccessFilter,
  type QueryProps,
} from './helpers';

export type ListProductVersion = Awaited<
  ReturnType<typeof findProductVersions>
>[number];

export async function findVersionCount({
  client,
  productId,
  includeUnpublished = false,
}: {
  client: Client;
  productId: ID;
  includeUnpublished?: boolean;
}) {
  return client.aOSMarketplaceProductVersion.count({
    where: and<AOSMarketplaceProductVersion>([
      {OR: [{archived: false}, {archived: null}]},
      {marketplaceProduct: {id: productId}},
      !includeUnpublished && {
        statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
      },
    ]),
  });
}

export async function findProductVersions({
  productId,
  client,
  where,
  take,
  skip,
  includeUnpublished = false,
}: {
  productId: ID;
  client: Client;
  includeUnpublished?: boolean;
} & QueryProps<AOSMarketplaceProductVersion>) {
  return client.aOSMarketplaceProductVersion.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    where: and<AOSMarketplaceProductVersion>([
      {OR: [{archived: false}, {archived: null}]},
      {marketplaceProduct: {id: productId}},
      !includeUnpublished && {
        statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
      },
      where,
    ]),
    select: {
      id: true,
      ...versionNumberFields,
      dateOfPublish: true,
      changelog: true,
      statusSelect: true,
      bundleFile: {id: true},
      compatibilitySet: {
        select: {title: true},
        orderBy: {releasedOn: 'DESC'},
      },
    },
    orderBy: versionSortOrder,
  });
}

export type MyProductVersion = Awaited<
  ReturnType<typeof findMyProductVersions>
>[number];

/* Versions for the product-edit screen: every status (draft, in-review,
 * published, unpublished), newest first, scoped to a product the caller
 * publishes. Paginated — a `take` makes goovee attach `_count` (the total for
 * this filter) to each returned row, so no separate count query is needed. */
export async function findMyProductVersions({
  productId,
  mainPartnerId,
  client,
  workspace,
  take,
  skip,
}: {
  productId: ID;
  mainPartnerId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  take: number;
  skip: number;
}) {
  return client.aOSMarketplaceProductVersion.find({
    take,
    ...(skip ? {skip} : {}),
    where: {
      marketplaceProduct: withMyProductAccessFilter(
        workspace,
        mainPartnerId,
      )({
        id: productId,
      }),
    },
    orderBy: versionSortOrder,
    select: {
      id: true,
      version: true,
      ...versionNumberFields,
      changelog: true,
      statusSelect: true,
      dateOfPublish: true,
      bundleFile: {id: true, fileName: true, sizeText: true},
      compatibilitySet: {
        select: {id: true, title: true, name: true},
      },
    },
  });
}

/* Single source of truth for `marketplaceProduct.currentVersion` and
 * `marketplaceProduct.latestVersion`. Call after any
 * create/status-change/delete.
 *
 *   latestVersion  = highest sortkey across ALL versions of the product
 *   currentVersion = highest sortkey among PUBLISHED versions, or null */
export async function syncProductVersionPointers({
  client,
  productId,
}: {
  client: Client;
  productId: ID;
}): Promise<void> {
  const [latest, currentPublished, product] = await Promise.all([
    client.aOSMarketplaceProductVersion.findOne({
      where: {
        OR: [{archived: false}, {archived: null}],
        marketplaceProduct: {id: productId},
      },
      orderBy: versionSortOrder,
      select: {id: true},
    }),
    client.aOSMarketplaceProductVersion.findOne({
      where: {
        OR: [{archived: false}, {archived: null}],
        marketplaceProduct: {id: productId},
        statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
      },
      orderBy: versionSortOrder,
      select: {id: true},
    }),
    client.aOSMarketplaceProduct.findOne({
      where: {id: productId},
      select: {
        id: true,
        version: true,
        latestVersion: {id: true},
        currentVersion: {id: true},
      },
    }),
  ]);
  if (!product) return;

  const nextLatest = latest?.id ?? null;
  const nextCurrent = currentPublished?.id ?? null;
  /* Idempotent: only write when a pointer actually moved, so a version edit that
   * didn't change any status (e.g. a changelog or compatibility tweak) doesn't
   * needlessly rewrite — and bump the version of — the product row. */
  if (
    (product.latestVersion?.id ?? null) === nextLatest &&
    (product.currentVersion?.id ?? null) === nextCurrent
  ) {
    return;
  }

  await client.aOSMarketplaceProduct.update({
    data: {
      id: product.id,
      version: product.version,
      latestVersion: {select: {id: nextLatest}},
      currentVersion: {select: {id: nextCurrent}},
    },
    select: {id: true},
  });
}

export type VersionForDownload = NonNullable<
  Awaited<ReturnType<typeof findVersionForDownload>>
>;

export async function findVersionForDownload({
  client,
  workspace,
  mainPartnerId,
  productId,
  versionId,
}: {
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  mainPartnerId: string | null | undefined;
  productId: ID;
  versionId: ID;
}) {
  return client.aOSMarketplaceProductVersion.findOne({
    where: withBundleAccessFilter({
      workspace,
      mainPartnerId: mainPartnerId ?? undefined,
      productId,
    })({id: versionId}),
    select: {
      id: true,
      bundleFile: {id: true},
    },
  });
}
