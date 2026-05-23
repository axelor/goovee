import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceProductVersion} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {and} from '@/utils/orm';
import {MARKETPLACE_VERSION_STATUS} from '../constants/statuses';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import type {QueryProps} from './helpers';
import {withBundleAccessFilter, type ORMRecord} from './helpers';

// ---- PRODUCT VERSIONS ---- //

export type ListProductVersion = Awaited<
  ReturnType<typeof findProductVersions>
>[number];

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

// ---- VERSION LOOKUPS ---- //

export async function findMatchingPublishedVersion({
  client,
  versionId,
  productId,
}: {
  client: Client;
  versionId: ID;
  productId: ID;
}): Promise<ORMRecord | null> {
  return client.aOSMarketplaceProductVersion.findOne({
    where: {
      id: versionId,
      product: {id: productId},
      statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
    },
    select: {id: true},
  });
}

export async function findNewestPublishedVersion({
  client,
  productId,
}: {
  client: Client;
  productId: ID;
}): Promise<ORMRecord | null> {
  return client.aOSMarketplaceProductVersion.findOne({
    where: {
      product: {id: productId},
      statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
    },
    orderBy: {versionNumber: 'DESC'},
    select: {id: true},
  });
}

export async function findPublishedAlternateVersions({
  client,
  productId,
  excludeVersionId,
}: {
  client: Client;
  productId: ID;
  excludeVersionId: ID;
}): Promise<ORMRecord[]> {
  return client.aOSMarketplaceProductVersion.find({
    where: {
      product: {id: productId},
      statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
      id: {ne: excludeVersionId},
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
      productId: String(productId),
    })({id: versionId}),
    select: {
      id: true,
      bundleFile: {id: true},
    },
  });
}
