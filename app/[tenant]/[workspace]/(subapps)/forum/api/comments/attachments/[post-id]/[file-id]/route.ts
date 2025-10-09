import {NextRequest, NextResponse} from 'next/server';

import {getSession} from '@/auth';
import {isFileOfRecord} from '@/comments/orm';
import {SUBAPP_CODES} from '@/constants';
import {isCommentEnabled} from '@/lib/core/comments';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {findPosts} from '@/subapps/forum/common/orm/forum';

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      tenant: string;
      workspace: string;
      'post-id': string;
      'file-id': string;
    };
  },
) {
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {'post-id': postId, 'file-id': fileId} = params;

  const session = await getSession();
  const user = session?.user;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.forum, workspace})) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.forum,
    user,
    url: workspaceURL,
    tenantId,
  });
  if (!app?.installed) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const {posts = []}: any = await findPosts({
    whereClause: {id: postId},
    workspaceID: workspace.id,
    tenantId,
    user,
  });
  if (!posts.length) {
    return new NextResponse('Forbidden', {status: 403});
  }

  if (!(await isFileOfRecord({recordId: postId, fileId, tenantId}))) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const file = await findFile({
    id: fileId,
    meta: true,
    tenant: tenantId,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
