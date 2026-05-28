import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {RELATED_MODELS, SUBAPP_CODES} from '@/constants';
import {getSession} from '@/lib/core/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {findLatestDMSFileByName, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {getWhereClauseForEntity} from '@/utils/filters';
import {PartnerKey} from '@/types';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {findOrder} from '@/subapps/orders/common/orm/orders';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'order-id': string;
      'customer-delivery-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {'order-id': orderId, 'customer-delivery-id': customerDeliveryId} =
    params;

  const session = await getSession();
  if (!session?.user) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const user = session.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return new NextResponse('Bad Request', {status: 400});
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.orders,
    user: session?.user,
    url: workspaceURL,
    client,
  });

  if (!subapp?.isInstalled) {
    return new NextResponse('Access denied', {status: 401});
  }

  const orderWhereClause = getWhereClauseForEntity({
    user,
    role: subapp.role,
    isContactAdmin: subapp.isContactAdmin,
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

  const customerDelivery = order.customerDeliveries?.find(
    delivery => String(delivery.id) === String(customerDeliveryId),
  );

  if (!customerDelivery) {
    return new NextResponse('Customer delivery not found', {status: 404});
  }

  const file = await findLatestDMSFileByName({
    client: tenant.client,
    storage: tenant.config.aos.storage,
    user,
    relatedId: customerDelivery.id,
    relatedModel: RELATED_MODELS.STOCK_MOVE,
    name: customerDelivery.stockMoveSeq || '',
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
