import {NextRequest, NextResponse} from 'next/server';

import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {manager} from '@/tenant';
import {getShellConfig} from '../../../../orm/config';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);

  const session = await getSession();
  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return new NextResponse('Bad Request', {status: 400});
  const {client} = tenant;

  const workspace = await findWorkspace({user, url: workspaceURL, client});
  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const config = await getShellConfig(workspace.config.id, client);
  if (!config) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const logoId = workspace.logo?.id || config.company?.logo?.id;
  if (!logoId) {
    return new NextResponse('Logo not available', {status: 404});
  }

  const file = await findFile({
    id: logoId,
    meta: true,
    client: tenant.client,
    storage: tenant.config.aos.storage,
  });
  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
