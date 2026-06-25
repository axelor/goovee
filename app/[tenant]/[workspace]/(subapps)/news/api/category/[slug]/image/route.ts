import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessStatus} from '@/lib/core/access/denial';
import {getWorkspaceConfig} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {findCategoryImageBySlug} from '@/subapps/news/common/orm/news';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      slug: string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {slug} = params;

  const access = await ensureAuth({
    code: SUBAPP_CODES.news,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });
  if (!access.ok) {
    return new NextResponse('Unauthorized', {
      status: accessStatus(access.reason),
    });
  }
  const {client} = access;

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) {
    return new NextResponse('Image not found', {status: 404});
  }

  const imageId = await findCategoryImageBySlug({
    slug,
    workspace: {...access.workspace, config},
    client,
    user: access.user,
  });

  if (!imageId) {
    return new NextResponse('Image not found', {status: 404});
  }

  const file = await findFile({
    id: imageId,
    meta: true,
    client,
    storage: access.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
