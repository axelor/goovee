import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessStatus} from '@/lib/core/access/denial';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {findPosts} from '@/subapps/forum/common/orm/forum';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'post-id': string;
      'file-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {'post-id': postId, 'file-id': fileId} = params;

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
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

  const {posts} = await findPosts({
    whereClause: {id: postId},
    workspaceID: access.workspace.id,
    client,
    user: access.user,
  });

  const attachment = posts?.[0]?.attachmentList?.find(
    item => item.metaFile?.id && String(item.metaFile.id) === String(fileId),
  );

  if (!attachment) {
    return new NextResponse('Attachment not found', {status: 404});
  }

  const file = await findFile({
    id: attachment.metaFile.id as string,
    meta: true,
    client,
    storage: access.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
