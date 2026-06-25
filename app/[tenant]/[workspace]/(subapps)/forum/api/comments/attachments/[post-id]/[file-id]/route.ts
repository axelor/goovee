import {NextRequest, NextResponse} from 'next/server';

import {isFileOfRecord} from '@/comments/orm';
import {SUBAPP_CODES} from '@/constants';
import {isCommentEnabled} from '@/lib/core/comments';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessStatus} from '@/lib/core/access/denial';
import {getWorkspaceConfig} from '@/orm/workspace';
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
  const {user} = access;
  const {client} = access.tenant;

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) {
    return new NextResponse('Not found', {status: 404});
  }
  const workspace = {...access.workspace, config};

  if (!isCommentEnabled({subapp: SUBAPP_CODES.forum, workspace})) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const {posts = []} = await findPosts({
    whereClause: {id: postId},
    workspaceID: workspace.id,
    client,
    user,
  });
  if (!posts.length) {
    return new NextResponse('Forbidden', {status: 403});
  }

  if (!(await isFileOfRecord({recordId: postId, fileId, client}))) {
    return new NextResponse('Forbidden', {status: 403});
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
