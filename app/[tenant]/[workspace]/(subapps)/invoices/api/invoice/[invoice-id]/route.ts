import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {RELATED_MODELS, SUBAPP_CODES} from '@/constants';
import {getSession} from '@/lib/core/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {findLatestDMSFileByName, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {getWhereClauseForEntity} from '@/utils/filters';
import {PartnerKey} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {findInvoice} from '@/subapps/invoices/common/orm/invoices';

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

  let invoicesWhereClause = {};
  let user: any;

  if (!token) {
    const session = await getSession();
    user = session?.user;

    if (!user) {
      return new NextResponse('Unauthorized', {status: 401});
    }

    const subapp = await findSubappAccess({
      code: SUBAPP_CODES.invoices,
      user,
      url: workspaceURL,
      tenantId,
    });

    if (!subapp?.isInstalled) {
      return new NextResponse('Unauthorized', {status: 401});
    }

    invoicesWhereClause = getWhereClauseForEntity({
      user,
      role: subapp.role,
      isContactAdmin: subapp.isContactAdmin,
      partnerKey: PartnerKey.PARTNER,
    });
  }

  const workspace = await findWorkspace({
    url: workspaceURL,
    tenantId,
    user,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const invoice = await findInvoice({
    id: invoiceId,
    ...(token ? {token} : {params: {where: invoicesWhereClause}}),
    workspaceURL,
    tenantId,
  });

  if (!invoice) {
    return new NextResponse('Invoice not found', {status: 404});
  }

  const file = await findLatestDMSFileByName({
    tenant: tenantId,
    ...(token ? {skipUserCheck: true} : {user}),
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
