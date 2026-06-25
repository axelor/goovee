import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {RELATED_MODELS, SUBAPP_CODES} from '@/constants';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessStatus} from '@/lib/core/access/denial';
import {findLatestDMSFileByName, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {getWhereClauseForEntity} from '@/utils/filters';
import {PartnerKey} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {findOrder} from '@/subapps/orders/common/orm/orders';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'order-id': string;
      'invoice-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {'order-id': orderId, 'invoice-id': invoiceId} = params;

  const access = await ensureAuth({
    code: SUBAPP_CODES.orders,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: false,
  });
  if (!access.ok) {
    return new NextResponse('Unauthorized', {
      status: accessStatus(access.reason),
    });
  }
  const {client} = access.tenant;

  const orderWhereClause = getWhereClauseForEntity({
    user: access.user,
    role: access.subapp.role,
    isContactAdmin: access.subapp.isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const order = await findOrder({
    id: orderId,
    client,
    workspaceURL,
    params: {where: orderWhereClause},
  });

  if (!order) {
    return new NextResponse('Order not found', {status: 404});
  }

  const invoice = order.invoices?.find(
    invoice => String(invoice.id) === String(invoiceId),
  );

  if (!invoice) {
    return new NextResponse('Invoice not found', {status: 404});
  }

  const file = await findLatestDMSFileByName({
    client,
    storage: access.tenant.config.aos.storage,
    user: access.user,
    relatedId: invoice.id,
    relatedModel: RELATED_MODELS.INVOICE,
    name: invoice.invoiceId || '',
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
