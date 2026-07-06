import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {RELATED_MODELS, SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {ensureTokenAccess} from '@/lib/core/access/ensure-token-access';
import {accessStatus} from '@/lib/core/access/denial';
import {findLatestDMSFileByName, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {getWhereClauseForEntity} from '@/utils/filters';
import {PartnerKey, type User} from '@/types';
import type {Client} from '@/goovee/.generated/client';

// ---- LOCAL IMPORTS ---- //
import {findInvoice} from '@/subapps/invoices/common/orm/invoices';
import type {Invoice} from '@/subapps/invoices/common/types/invoices';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'invoice-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {'invoice-id': invoiceId} = params;
  const token = request.nextUrl.searchParams.get('token') ?? undefined;

  let client: Client;
  let storage: string | undefined | null;
  let invoice: Invoice | null;
  let fileAccess: {skipUserCheck: true} | {user: User};

  if (token) {
    /* Token path: the token is fused into findInvoice, which is what authorizes
       this specific invoice; ensureTokenAccess only resolves the workspace. */
    const access = await ensureTokenAccess({
      url: workspaceURL,
      tenantId,
      token,
    });
    if (!access.ok) {
      return new NextResponse('Not found', {
        status: accessStatus(access.reason),
      });
    }
    client = access.tenant.client;
    storage = access.tenant.config.aos.storage;
    invoice = await findInvoice({
      id: invoiceId,
      token: access.token,
      workspaceURL,
      client,
    });
    fileAccess = {skipUserCheck: true};
  } else {
    const access = await ensureAccess({
      code: SUBAPP_CODES.invoices,
      url: workspaceURL,
      tenantId,
      allowGuest: false,
    });
    if (!access.ok) {
      return new NextResponse('Unauthorized', {
        status: accessStatus(access.reason),
      });
    }
    client = access.tenant.client;
    storage = access.tenant.config.aos.storage;
    const invoicesWhereClause = getWhereClauseForEntity({
      user: access.user,
      role: access.subapp.role,
      isContactAdmin: access.subapp.isContactAdmin,
      partnerKey: PartnerKey.PARTNER,
    });
    invoice = await findInvoice({
      id: invoiceId,
      params: {where: invoicesWhereClause},
      workspaceURL,
      client,
    });
    fileAccess = {user: access.user};
  }

  if (!invoice) {
    return new NextResponse('Invoice not found', {status: 404});
  }

  const file = await findLatestDMSFileByName({
    client,
    storage,
    ...fileAccess,
    relatedId: invoiceId,
    relatedModel: RELATED_MODELS.INVOICE,
    name: invoice.invoiceId || '',
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  const allowedTypes = ['application/pdf'];

  if (!allowedTypes.includes(file.fileType)) {
    return new NextResponse('Unsupported file type', {status: 415});
  }

  return streamFile(file);
}
