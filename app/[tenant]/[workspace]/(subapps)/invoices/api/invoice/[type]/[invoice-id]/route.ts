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
      type: string;
    }>;
  }
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {'invoice-id': invoiceId, type} = params;

  const session = await getSession();

  const user = session!.user;

  if (!user) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.invoices,
    user: session?.user,
    url: workspaceURL,
    tenantId,
  });

  if (!subapp?.isInstalled) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const invoicesWhereClause = getWhereClauseForEntity({
    user,
    role: subapp.role,
    isContactAdmin: subapp.isContactAdmin,
    partnerKey: PartnerKey.PARTNER,
  });

  const invoice = await findInvoice({
    id: invoiceId,
    params: {where: invoicesWhereClause},
    type,
    workspaceURL,
    tenantId,
  });

  if (!invoice) {
    return new NextResponse('Invoice not found', {status: 404});
  }

  const file = await findLatestDMSFileByName({
    tenant: tenantId,
    user,
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
