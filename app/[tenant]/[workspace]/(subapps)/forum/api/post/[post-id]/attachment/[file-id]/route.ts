import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {getSession} from '@/lib/core/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
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
  }
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {'post-id': postId, 'file-id': fileId} = params;

  const session = await getSession();

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.forum,
    user: session?.user,
    url: workspaceURL,
    tenantId,
  });
  if (!subapp) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const {posts = []}: any = await findPosts({
    whereClause: {id: postId},
    workspaceID: workspace.id,
    tenantId,
    user: session?.user,
  });

  const attachment = posts?.[0]?.attachmentList?.find(
    (item: any) =>
      item.metaFile?.id && String(item.metaFile.id) === String(fileId),
  );

  if (!attachment) {
    return new NextResponse('Attachment not found', {status: 404});
  }

  const file = await findFile({
    id: attachment.metaFile.id,
    meta: true,
    tenant: tenantId,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
