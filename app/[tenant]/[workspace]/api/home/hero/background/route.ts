import {getSession} from '@/lib/core/auth';
import {findWorkspace} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {NextRequest, NextResponse} from 'next/server';

export async function GET(
  request: NextRequest,
  {params}: {params: {tenant: string; workspace: string}},
) {
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);

  const session = await getSession();

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  if (!workspace.config?.isHomepageDisplay) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const bgImageId = workspace.config?.homepageHeroBgImage?.id;

  if (!bgImageId) {
    return new NextResponse('Image not found', {status: 404});
  }

  const file = await findFile({
    id: bgImageId,
    meta: true,
    tenant: tenantId,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
