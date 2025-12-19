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
import {findOrder} from '@/subapps/orders/common/orm/orders';
import {OrderType} from '@/subapps/orders/common/types/orders';
import {ORDER} from '@/subapps/orders/common/constants/orders';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'order-type': OrderType;
      'order-id': string;
      'customer-delivery-id': string;
    }>;
  }
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {
    'order-type': orderType,
    'order-id': orderId,
    'customer-delivery-id': customerDeliveryId,
  } = params;
  const isCompleted = orderType === ORDER.COMPLETED;

  const session = await getSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const user = session.user;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.orders,
    user: session?.user,
    url: workspaceURL,
    tenantId,
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
    tenantId,
    workspaceURL,
    params: {where: orderWhereClause},
    isCompleted,
  });

  if (!order) {
    return new NextResponse('Order not found', {status: 404});
  }

  const customerDelivery = order.customerDeliveries?.find(
    invoice => String(invoice.id) === String(customerDeliveryId),
  );

  if (!customerDelivery) {
    return new NextResponse('Customer delivery not found', {status: 404});
  }

  const file = await findLatestDMSFileByName({
    tenant: tenantId,
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
