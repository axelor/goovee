import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {getSession} from '@/lib/core/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
export async function GET(
  request: NextRequest,
  props: {params: Promise<{tenant: string; workspace: string; id: string}>}
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {id} = params;

  const session = await getSession();

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.shop,
    user: session?.user,
    url: workspaceURL,
    tenantId,
  });

  if (!subapp?.isInstalled) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const imageId = workspace.config?.carouselList?.find(item => item.id === id)
    ?.image?.id;

  if (!imageId) {
    return new NextResponse('Image not found', {status: 404});
  }

  const file = await findFile({
    id: imageId,
    meta: true,
    tenant: tenantId,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
