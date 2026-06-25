import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {isFileOfRecord} from '@/comments/orm';
import {SUBAPP_CODES} from '@/constants';
import {isCommentEnabled} from '@/lib/core/comments';
import {accessStatus} from '@/lib/core/access/denial';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getWorkspaceConfig} from '@/orm/workspace';
import {clone} from '@/utils';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {findNews} from '../../../../../common/orm/news';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'news-id': string;
      'file-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {'news-id': newsId, 'file-id': fileId} = params;

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
  const {user, client} = access;

  /* WorkspaceLight carries config as {id} only, so fetch the heavy config and
     bridge it onto the workspace for isCommentEnabled and findNews. */
  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) {
    return new NextResponse('Forbidden', {status: 403});
  }
  const workspace = clone({...access.workspace, config});

  if (!isCommentEnabled({subapp: SUBAPP_CODES.news, workspace})) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const {news} = await findNews({
    id: newsId,
    workspace,
    client,
    user,
  });
  if (!news?.length) {
    return new NextResponse('Forbidden', {status: 403});
  }
  if (!(await isFileOfRecord({recordId: newsId, fileId, client}))) {
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
