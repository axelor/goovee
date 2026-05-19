import {NextRequest, NextResponse} from 'next/server';

import {TENANT_HEADER} from '@/proxy';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

import {ensureAuth} from '../../../common/utils/auth-helper';

export async function GET(
  request: NextRequest,
  props: {params: Promise<{tenant: string; workspace: string}>},
) {
  const params = await props.params;
  const {workspaceURL} = workspacePathname(params);
  const tenantId = request.headers.get(TENANT_HEADER) ?? params.tenant;

  const {error, auth} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: true,
  });
  if (error) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const bgImageId = auth.workspace.config.marketplaceHeroBgImage?.id;
  if (!bgImageId) {
    return new NextResponse('Image not found', {status: 404});
  }

  const file = await findFile({
    id: bgImageId,
    meta: true,
    client: auth.tenant.client,
    storage: auth.tenant.config.aos.storage,
  });
  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
