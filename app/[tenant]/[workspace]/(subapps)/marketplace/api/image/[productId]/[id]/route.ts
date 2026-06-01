import {NextRequest, NextResponse} from 'next/server';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {ensureAuth} from '../../../../common/utils/auth-helper';
import {getProductScreenshot} from '../../../../common/orm';

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
      productId: string;
      id: string;
    }>;
  },
) {
  const {tenant: tenantId, workspace, productId, id} = await props.params;
  const {workspaceURL} = workspacePathname({tenant: tenantId, workspace});

  const {error, auth} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: true,
  });
  if (error) {
    return new NextResponse('Unauthorized', {status: 401});
  }
  const {client} = auth.tenant;

  const picture = await getProductScreenshot({
    client,
    workspace: auth.workspace,
    productId,
    fileId: id,
  });
  if (!picture?.id) {
    return new NextResponse('Picture not found', {status: 404});
  }

  const file = await findFile({
    id: picture.id,
    meta: true,
    client,
    storage: auth.tenant.config.aos.storage,
  });
  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
