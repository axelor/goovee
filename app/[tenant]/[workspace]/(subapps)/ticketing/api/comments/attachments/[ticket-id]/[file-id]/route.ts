import {NextRequest, NextResponse} from 'next/server';

import {isFileOfRecord} from '@/comments/orm';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {isCommentEnabled} from '@/comments';

import {findTicketAccess} from '../../../../../common/orm/tickets';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessStatus} from '@/lib/core/access/denial';
import {getWorkspaceConfig} from '@/orm/workspace';
import {SUBAPP_CODES} from '@/constants';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'ticket-id': string;
      'file-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {'ticket-id': ticketId, 'file-id': fileId} = params;

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: false,
  });
  if (!access.ok) {
    return new NextResponse('Unauthorized', {
      status: accessStatus(access.reason),
    });
  }
  const {user, subapp} = access;
  const {client} = access.tenant;

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) {
    return new NextResponse('Not found', {status: 404});
  }
  const workspace = {...access.workspace, config};

  if (!isCommentEnabled({subapp: SUBAPP_CODES.ticketing, workspace})) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const ticket = await findTicketAccess({
    client,
    user,
    subapp,
    workspace,
    recordId: ticketId,
  });
  if (!ticket) {
    return new NextResponse('Forbidden', {status: 403});
  }

  if (
    !(await isFileOfRecord({
      recordId: ticketId,
      fileId,
      client,
    }))
  ) {
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
