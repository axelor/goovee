import {NextRequest, NextResponse} from 'next/server';

import {getSession} from '@/auth';
import {isFileOfRecord} from '@/comments/orm';
import {SUBAPP_CODES} from '@/constants';
import {isCommentEnabled} from '@/lib/core/comments';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {manager} from '@/tenant';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

import {findEventIdForAccess} from '../../../../../common/orm/event';

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
  const {workspaceURL} = workspacePathname(params);
  const {slug, 'file-id': fileId, tenant: tenantId} = params;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return new NextResponse('Bad Request', {status: 400});
  const {client} = tenant;

  const session = await getSession();
  const user = session?.user;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.events, workspace})) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.events,
    user,
    url: workspaceURL,
    client,
  });
  if (!app?.isInstalled) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const event = await findEventIdForAccess({
    slug,
    workspaceURL,
    client,
    user,
  });
  if (!event) {
    return new NextResponse('Forbidden', {status: 403});
  }

  if (!(await isFileOfRecord({recordId: event.id, fileId, client}))) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const file = await findFile({
    id: fileId,
    meta: true,
    client: tenant.client,
    storage: tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
