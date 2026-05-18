import {NextRequest, NextResponse} from 'next/server';

import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

import {withBundleAccessFilter} from '@/app/[tenant]/[workspace]/(subapps)/marketplace/common/orm/helpers';
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
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {'product-id': productId, 'version-id': versionId} = params;

  const {error, auth} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: true,
  });
  if (error) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const {client} = auth.tenant;

  const version = await client.aOSMarketplaceProductVersion.findOne({
    where: withBundleAccessFilter({
      workspace: auth.workspace,
      userId: auth.user?.id,
      productId,
    })({id: versionId}),
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
