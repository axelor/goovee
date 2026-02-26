import {NextRequest, NextResponse} from 'next/server';

import {getSession} from '@/lib/core/auth';
import {findWorkspace} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

export async function GET(
  request: NextRequest,
  props: {params: Promise<{tenant: string; workspace: string; id: string}>},
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

  const logoId = workspace.config?.hyperlinkList?.find(item => item.id === id)
    ?.logo?.id;

  if (!logoId) {
    return new NextResponse('Logo not found', {status: 404});
  }

  const file = await findFile({
    id: logoId,
    meta: true,
    tenant: tenantId,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
