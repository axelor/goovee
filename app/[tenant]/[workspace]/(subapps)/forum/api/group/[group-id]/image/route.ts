import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {getSession} from '@/lib/core/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {findGroupById} from '@/subapps/forum/common/orm/forum';

export async function GET(
  request: NextRequest,
  {params}: {params: {tenant: string; workspace: string; 'group-id': string}},
) {
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {'group-id': groupId} = params;

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
    code: SUBAPP_CODES.forum,
    user: session?.user,
    url: workspaceURL,
    tenantId,
  });
  if (!subapp) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const group = await findGroupById(
    groupId,
    String(workspace.id),
    tenantId,
    session?.user,
  );

  if (!group?.image?.id) {
    return new NextResponse('Image not found', {status: 404});
  }

  const imageId = group.thumbnailImage?.id || group.image?.id;
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
