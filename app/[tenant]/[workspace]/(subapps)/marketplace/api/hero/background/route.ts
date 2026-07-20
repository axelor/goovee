import {TENANT_HEADER} from '@/proxy';
import {SUBAPP_CODES} from '@/constants';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {NextRequest, NextResponse} from 'next/server';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessStatus} from '@/lib/core/access/denial';
import {getMarketplaceConfig} from '../../../common/orm/config';

export async function GET(
  request: NextRequest,
  props: {params: Promise<{tenant: string; workspace: string}>},
) {
  const params = await props.params;
  const {workspaceURL} = workspacePathname(params);
  const tenantId = request.headers.get(TENANT_HEADER) ?? params.tenant;

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

  const config = await getMarketplaceConfig(access.workspace.config.id, client);
  const bgImageId = config?.marketplaceHeroBgImage?.id;
  if (!bgImageId) {
    return new NextResponse('Image not found', {status: 404});
  }

  const file = await findFile({
    id: bgImageId,
    meta: true,
    client,
    storage: access.tenant.config.aos.storage,
  });
  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
