import {NextRequest, NextResponse} from 'next/server';

import {getSession} from '@/auth';
import {isFileOfRecord} from '@/comments/orm';
import {SUBAPP_CODES} from '@/constants';
import {isCommentEnabled} from '@/lib/core/comments';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

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
  }
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {'news-id': newsId, 'file-id': fileId} = params;

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

  if (!isCommentEnabled({subapp: SUBAPP_CODES.news, workspace})) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.news,
    user,
    url: workspaceURL,
    tenantId,
  });
  if (!app?.isInstalled) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const {news}: any = await findNews({
    id: newsId,
    workspace,
    tenantId,
    user,
  });
  if (!news?.length) {
    return new NextResponse('Forbidden', {status: 403});
  }
  if (!(await isFileOfRecord({recordId: newsId, fileId, tenantId}))) {
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
