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
      select: {id: true, version: true},
    }),
  ]);
  if (!product) return;

  await client.aOSMarketplaceProduct.update({
    data: {
      id: product.id,
      version: product.version,
      latestVersion: {select: {id: latest?.id ?? null}},
      currentVersion: {select: {id: currentPublished?.id ?? null}},
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
