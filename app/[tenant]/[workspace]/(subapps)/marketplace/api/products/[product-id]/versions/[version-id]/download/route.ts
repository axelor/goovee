import {NextRequest, NextResponse, after} from 'next/server';

import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {sql} from '@/utils/template-string';

import {withBundleAccessFilter} from '@/app/[tenant]/[workspace]/(subapps)/marketplace/common/orm/helpers';
import {ensureAuth} from '@/app/[tenant]/[workspace]/(subapps)/marketplace/common/utils/auth-helper';

export async function GET(
  _request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'product-id': string;
      'version-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {'product-id': productId, 'version-id': versionId} = params;

  const {error, auth} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: true,
  });
  if (error) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const {client} = auth.tenant;

  const version = await client.aOSMarketplaceProductVersion.findOne({
    where: withBundleAccessFilter({
      workspace: auth.workspace,
      partnerId: auth.user?.mainPartnerId,
      productId,
    })({id: versionId}),
    select: {
      id: true,
      bundleFile: {id: true},
    },
  });
  if (!version || !version.bundleFile?.id) {
    return new NextResponse('File not found', {status: 404});
  }

  const file = await findFile({
    id: version.bundleFile.id,
    meta: true,
    client,
    storage: auth.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  /* Telemetry: write the download record and bump installCount after the
   * response is flushed so it never blocks the stream. Both happen inside
   * a transaction — if the download insert fails, the increment rolls back
   * with it. The bump goes through raw SQL so it (a) is an atomic Postgres
   * `+= 1` (no read-modify-write race) and (b) does NOT touch the row's
   * optimistic-lock `version` column, so concurrent product edits aren't
   * forced to retry. Every hit counts; no filtering. Failures are swallowed
   * since this is best-effort. */
  after(async () => {
    try {
      await client.$transaction(async tx => {
        await tx.aOSMarketplaceDownload.create({
          data: {
            product: {select: {id: productId}},
            productVersion: {select: {id: versionId}},
            ...(auth.user?.id && {partner: {select: {id: auth.user.id}}}),
          },
          select: {id: true},
        });
        await tx.$raw(
          sql`
            UPDATE base_product
            SET
              install_count = COALESCE(install_count, 0) + 1
            WHERE
              id = $1
          `,
          productId,
        );
      });
    } catch (e) {
      console.error('marketplace: failed to record install', {
        productId,
        versionId,
        userId: auth.user?.id ?? null,
        error: e,
      });
    }
  });

  return streamFile(file);
}
