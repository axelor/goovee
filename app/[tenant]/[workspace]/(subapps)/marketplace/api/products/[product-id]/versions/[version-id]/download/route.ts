import {NextRequest, NextResponse} from 'next/server';

import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

import {findProductAccess} from '@/app/[tenant]/[workspace]/(subapps)/marketplace/common/orm/orm';
import {ensureAuth} from '@/app/[tenant]/[workspace]/(subapps)/marketplace/common/utils/auth-helper';

export async function GET(
  _request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'product-id': string;
      'version-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {'product-id': productId, 'version-id': versionId} = params;

  const {error, auth} = await ensureAuth(workspaceURL, tenant, {
    allowGuest: true,
  });
  if (error) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const {workspace} = auth;
  const {client} = auth.tenant;

  const product = await findProductAccess({
    recordId: productId,
    client,
    workspace,
    select: {id: true},
  });
  if (!product) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const version = await client.aOSMarketplaceProductVersion.findOne({
    where: {
      id: versionId,
      product: {id: productId},
    },
    select: {
      id: true,
      bundleFile: {id: true},
    },
  });
  if (!version || !version.bundleFile?.id) {
    return new NextResponse('File not found', {status: 404});
  }

  const file = await findFile({
    id: version.bundleFile.id,
    meta: true,
    client,
    storage: auth.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
