import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessStatus} from '@/lib/core/access/denial';
import {getWorkspaceConfig} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
export async function GET(
  request: NextRequest,
  props: {params: Promise<{tenant: string; workspace: string; id: string}>},
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {id} = params;

  const access = await ensureAuth({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });
  if (!access.ok) {
    return new NextResponse('Unauthorized', {
      status: accessStatus(access.reason),
    });
  }
  const {client} = access.tenant;

  const config = await getWorkspaceConfig(access.workspace.config.id, client);

  const imageId = config?.carouselList?.find(item => item.id === id)?.image?.id;

  if (!imageId) {
    return new NextResponse('Image not found', {status: 404});
  }

  const file = await findFile({
    id: imageId,
    meta: true,
    client,
    storage: access.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
