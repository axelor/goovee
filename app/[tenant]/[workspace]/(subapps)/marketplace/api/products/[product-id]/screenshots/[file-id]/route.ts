import {NextRequest, NextResponse} from 'next/server';
import {SUBAPP_CODES} from '@/constants';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {getPartnerId} from '@/utils';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessStatus} from '@/lib/core/access/denial';
import {getProductScreenshot} from '../../../../../common/orm';

/**
 * Serves a marketplace product screenshot. Lives inside the marketplace app
 * so the workspace is in the path — the access check is workspace-scoped via
 * `getProductScreenshot` (withProductAccessFilter). The shared
 * `/api/tenant/[tenant]/product/image/[id]` route only resolves metafiles
 * owned by a base AOSProduct, which marketplace pictures are not.
 */
export async function GET(
  _request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'product-id': string;
      'file-id': string;
    }>;
  },
) {
  const {
    tenant: tenantId,
    workspace,
    'product-id': productId,
    'file-id': fileId,
  } = await props.params;
  const {workspaceURL} = workspacePathname({tenant: tenantId, workspace});

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

  const picture = await getProductScreenshot({
    client,
    workspace: access.workspace,
    productId,
    fileId,
    mainPartnerId: access.user ? getPartnerId(access.user) : undefined,
  });
  if (!picture?.id) {
    return new NextResponse('Picture not found', {status: 404});
  }

  const file = await findFile({
    id: picture.id,
    meta: true,
    client,
    storage: access.tenant.config.aos.storage,
  });
  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
