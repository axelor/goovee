import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessStatus} from '@/lib/core/access/denial';
import {getWorkspaceConfig} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {isAttachmentOfNews} from '@/subapps/news/common/orm/news';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      slug: string;
      'file-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {slug, 'file-id': fileId} = params;

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
  const {client} = access.tenant;

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) {
    return new NextResponse('Invalid workspace', {status: 404});
  }

  const workspace = clone({...access.workspace, config});

  const attachmentBelongsToNews = await isAttachmentOfNews({
    slug,
    fileId,
    workspace,
    client,
    user: access.user,
  });

  if (!attachmentBelongsToNews) {
    return new NextResponse('Attachment not found', {status: 404});
  }

  const file = await findFile({
    id: fileId,
    meta: true,
    client,
    storage: access.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
