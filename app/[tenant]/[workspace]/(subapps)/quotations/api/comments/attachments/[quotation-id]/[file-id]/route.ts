import {NextRequest, NextResponse} from 'next/server';

import {getSession} from '@/auth';
import {isFileOfRecord} from '@/comments/orm';
import {SUBAPP_CODES} from '@/constants';
import {isCommentEnabled} from '@/lib/core/comments';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {PartnerKey} from '@/types';
import {findFile, streamFile} from '@/utils/download';
import {getWhereClauseForEntity} from '@/utils/filters';
import {workspacePathname} from '@/utils/workspace';
import {findQuotation} from '../../../../../common/orm/quotations';

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      tenant: string;
      workspace: string;
      'quotation-id': string;
      'file-id': string;
    };
  },
) {
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {'quotation-id': quotationId, 'file-id': fileId} = params;

  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.quotations, workspace})) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.quotations,
    user,
    url: workspaceURL,
    tenantId,
  });
  if (!app?.isInstalled) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const {role, isContactAdmin} = app;

  const quotationWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const quotation = await findQuotation({
    id: quotationId,
    tenantId,
    params: {where: quotationWhereClause},
    workspaceURL,
  });

  if (!quotation) {
    return new NextResponse('Forbidden', {status: 403});
  }

  if (!(await isFileOfRecord({recordId: quotationId, fileId, tenantId}))) {
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
