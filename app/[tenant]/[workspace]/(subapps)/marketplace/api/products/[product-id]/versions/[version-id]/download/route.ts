import {
  createDownloadRecord,
  findVersionForDownload,
  incrementInstallCount,
} from '@/subapps/marketplace/common/orm';
import {SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessStatus} from '@/lib/core/access/denial';
import {getPartnerId} from '@/utils';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {NextRequest, NextResponse, after} from 'next/server';

export async function GET(
  request: NextRequest,
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

  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return new NextResponse('Unauthorized', {
      status: accessStatus(access.reason),
    });
  }

  const {client} = access.tenant;

  const version = await findVersionForDownload({
    client,
    workspace: access.workspace,
    mainPartnerId: access.user ? getPartnerId(access.user) : undefined,
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
    storage: access.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  /* `response.status` is fixed when the response is built, before a byte
   * reaches the client, so a 200 only says the file was offered. The count
   * comes from the transfer: an abandoned download is not counted, but one cut
   * after the server has read the last byte is. */
  let readWholeFile = false;

  const response = await streamFile({
    ...file,
    request,
    onWholeFileRead: () => {
      readWholeFile = true;
    },
  });

  /* One install is one whole file handed over. A response here can also be a
   * revalidation (304), one range out of many (206), or the framework's HEAD
   * derived from this handler — none of which is a new download. Counting every
   * response would credit a paused-and-resumed download twice and a segmented
   * downloader once per connection, and this route now advertises
   * `accept-ranges`, so clients are invited to segment.
   *
   * What was served decides this, not what the request asked for. A partial is
   * only ever answered to an inbound range, so excluding anything but 200
   * already excludes every partial — while a range the server declines to
   * honour (for instance a stale `if-range` after the bundle changed under an
   * interrupted download) sends the whole file as a 200, and that is a real
   * download to count. HEAD needs the method tested separately, since it
   * answers 200 with no body at all. */
  const isWholeTransfer = request.method === 'GET' && response.status === 200;

  if (!isWholeTransfer) {
    return response;
  }

  /* Telemetry: write the download record and bump installCount after the
   * response is flushed so it never blocks the stream. Both happen inside
   * a transaction — if the download insert fails, the increment rolls back
   * with it. The bump goes through raw SQL so it (a) is an atomic Postgres
   * `+= 1` (no read-modify-write race) and (b) does NOT touch the row's
   * optimistic-lock `version` column, so concurrent product edits aren't
   * forced to retry. Failures are swallowed since this is best-effort.
   *
   * Runs when the response closes, which is after the file was read or after
   * the transfer was cut short, so the flag can no longer change. It stays
   * false for an answer that never handed the file over. */
  after(async () => {
    if (!readWholeFile) return;

    try {
      await client.$transaction(async txClient => {
        await createDownloadRecord({
          client: txClient,
          productId,
          versionId,
          partnerId: access.user?.id,
        });
        await incrementInstallCount({client: txClient, productId});
      });
    } catch (error) {
      console.error('marketplace: failed to record install', {
        productId,
        versionId,
        userId: access.user?.id ?? null,
        error,
      });
    }
  });

  return response;
}
