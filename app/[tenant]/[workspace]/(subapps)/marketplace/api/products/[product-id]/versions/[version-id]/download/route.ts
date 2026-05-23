import {
  createDownloadRecord,
  findVersionForDownload,
  incrementInstallCount,
} from '@/subapps/marketplace/common/orm';
import {ensureAuth} from '@/subapps/marketplace/common/utils/auth-helper';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {NextRequest, NextResponse, after} from 'next/server';

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

  const version = await findVersionForDownload({
    client,
    workspace: auth.workspace,
    mainPartnerId: auth.user?.mainPartnerId,
    productId,
    versionId,
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
      await client.$transaction(async txClient => {
        await createDownloadRecord({
          client: txClient,
          productId,
          versionId,
          partnerId: auth.user?.id,
        });
        await incrementInstallCount({client: txClient, productId});
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
