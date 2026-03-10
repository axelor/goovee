import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {RELATED_MODELS} from '@/constants';
import {findWorkspace} from '@/orm/workspace';
import {findLatestDMSFileByName, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {findInvoice} from '@/subapps/invoices/common/orm/invoices';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      token: string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {token} = params;

  const workspace = await findWorkspace({
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const invoice = await findInvoice({
    token: token,
    workspaceURL,
    tenantId,
  });

  if (!invoice) {
    return new NextResponse('Invoice not found', {status: 404});
  }

  const file = await findLatestDMSFileByName({
    tenant: tenantId,
    relatedId: invoice.id,
    relatedModel: RELATED_MODELS.INVOICE,
    name: invoice.invoiceId || '',
    skipUserCheck: true,
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
