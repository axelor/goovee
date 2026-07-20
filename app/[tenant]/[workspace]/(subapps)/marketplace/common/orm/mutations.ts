import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceDownload} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {sql} from '@/utils/template-string';
import type {CreateArgs} from '@goovee/orm';
import type {ORMRecord} from './helpers';

// ---- VERSION MUTATIONS ---- //

/** Sets the status of an existing version (used by the unpublish flow).
 *  Caller supplies id+version+statusSelect. */
export async function updateVersionStatus({
  client,
  versionId,
  version,
  statusSelect,
}: {
  client: Client;
  versionId: ID;
  version: number;
  statusSelect: string;
}): Promise<ORMRecord> {
  return client.aOSMarketplaceProductVersion.update({
    data: {
      id: versionId,
      version,
      statusSelect,
    },
    select: {id: true},
  });
}

// ---- DOWNLOAD TELEMETRY ---- //

export async function createDownloadRecord({
  client,
  productId,
  versionId,
  partnerId,
}: {
  client: Client;
  productId: ID;
  versionId: ID;
  partnerId?: ID | null;
}): Promise<ORMRecord> {
  const data: CreateArgs<AOSMarketplaceDownload> = {
    marketplaceProduct: {select: {id: productId}},
    productVersion: {select: {id: versionId}},
    ...(partnerId && {partner: {select: {id: partnerId}}}),
  };
  return client.aOSMarketplaceDownload.create({
    data,
    select: {id: true},
  });
}

/* Atomic Postgres `+= 1` on `install_count` — does NOT touch the row's
 * optimistic-lock `version` column so concurrent product edits aren't
 * forced to retry. */
export async function incrementInstallCount({
  client,
  productId,
}: {
  client: Client;
  productId: ID;
}): Promise<void> {
  await client.$raw(
    sql`
      UPDATE portal_marketplace_product
      SET
        install_count = COALESCE(install_count, 0) + 1
      WHERE
        id = $1
    `,
    String(productId),
  );
}
