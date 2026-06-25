import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {isFileOfRecord} from '@/comments/orm';
import {SUBAPP_CODES} from '@/constants';
import {isCommentEnabled} from '@/lib/core/comments';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessStatus} from '@/lib/core/access/denial';
import {getWorkspaceConfig} from '@/orm/workspace';
import {PartnerKey} from '@/types';
import {findFile, streamFile} from '@/utils/download';
import {getWhereClauseForEntity} from '@/utils/filters';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {findQuotation} from '../../../../../common/orm/quotations';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'quotation-id': string;
      'file-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {'quotation-id': quotationId, 'file-id': fileId} = params;

  const access = await ensureAuth({
    code: SUBAPP_CODES.quotations,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: false,
  });
  if (!access.ok) {
    return new NextResponse('Unauthorized', {
      status: accessStatus(access.reason),
    });
  }
  const {user, subapp, client} = access;

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) {
    return new NextResponse('Not found', {status: 404});
  }
  const workspace = {...access.workspace, config};

  if (!isCommentEnabled({subapp: SUBAPP_CODES.quotations, workspace})) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const {role, isContactAdmin} = subapp;

  const quotationWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const quotation = await findQuotation({
    id: quotationId,
    client,
    params: {where: quotationWhereClause},
    workspaceURL,
  });

  if (!quotation) {
    return new NextResponse('Forbidden', {status: 403});
  }

  if (!(await isFileOfRecord({recordId: quotationId, fileId, client}))) {
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
