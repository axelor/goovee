import {getSession} from '@/lib/core/auth';
import {findWorkspace, getWorkspaceConfig} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {NextRequest, NextResponse} from 'next/server';
import {manager} from '@/tenant';

export async function GET(
  request: NextRequest,
  props: {params: Promise<{tenant: string; workspace: string}>},
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);

  const session = await getSession();

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return new NextResponse('Bad Request', {status: 400});
  const {client} = tenant;

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const config = await getWorkspaceConfig(workspace.config.id, client);
  if (!config) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  if (!config.isHomepageDisplay) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const bgImageId = config.homepageHeroBgImage?.id;

  if (!bgImageId) {
    return new NextResponse('Image not found', {status: 404});
  }

  const file = await findFile({
    id: bgImageId,
    meta: true,
    client: tenant.client,
    storage: tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
