import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {RELATED_MODELS, SUBAPP_CODES} from '@/constants';
import {getSession} from '@/lib/core/auth';
import {manager} from '@/tenant';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {findLatestDMSFileByName, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {getWhereClauseForEntity} from '@/utils/filters';
import {PartnerKey, User} from '@/types';

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

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return new NextResponse('Bad Request', {status: 400});
  }
  const {client} = tenant;

  let invoicesWhereClause = {};
  let user: User | undefined;

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
      client,
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
    client,
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
    client,
  });

  if (!invoice) {
    return new NextResponse('Invoice not found', {status: 404});
  }

  const file = await findLatestDMSFileByName({
    client: tenant.client,
    storage: tenant.config.aos.storage,
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
