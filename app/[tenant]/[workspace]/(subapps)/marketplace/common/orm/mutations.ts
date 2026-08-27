import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceDownload} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {sql} from '@/utils/template-string';
import type {CreateArgs} from '@goovee/orm';
import type {ORMRecord} from './helpers';

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
