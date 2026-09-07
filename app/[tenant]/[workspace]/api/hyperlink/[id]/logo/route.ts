import {NextRequest, NextResponse} from 'next/server';

import {accessStatus} from '@/lib/core/access/denial';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {findFile, streamFile} from '@/utils/download';

import {getShellConfig} from '../../../../orm/config';

export async function GET(
  request: NextRequest,
  props: {params: Promise<{id: string}>},
) {
  const {id} = await props.params;

  const access = await ensureAccess({allowGuest: true});
  if (!access.ok) {
    return new NextResponse('Invalid workspace', {
      status: accessStatus(access.reason),
    });
  }

  const {workspace, tenant} = access;
  const {client} = tenant;

  const config = await getShellConfig(workspace.config.id, client);
  if (!config) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const logoId = config.hyperlinkList?.find(item => item.id === id)?.logo?.id;

  if (!logoId) {
    return new NextResponse('Logo not found', {status: 404});
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

  return streamFile({...file, request});
}
