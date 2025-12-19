import {NextRequest, NextResponse} from 'next/server';

import {isFileOfRecord} from '@/comments/orm';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {isCommentEnabled} from '@/comments';

import {findTicketAccess} from '../../../../../common/orm/tickets';
import {ensureAuth} from '../../../../../common/utils/auth-helper';
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
  }
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {'ticket-id': ticketId, 'file-id': fileId} = params;

  const {error, info} = await ensureAuth(workspaceURL, tenant);
  if (error) {
    return new NextResponse('Unauthorized', {status: 401});
  }
  const {workspace} = info;

  if (!isCommentEnabled({subapp: SUBAPP_CODES.quotations, workspace})) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const {auth} = info;
  const ticket = await findTicketAccess({auth, recordId: ticketId});
  if (!ticket) {
    return new NextResponse('Forbidden', {status: 403});
  }

  if (!(await isFileOfRecord({recordId: ticketId, fileId, tenantId: tenant}))) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const file = await findFile({
    id: fileId,
    meta: true,
    tenant,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
