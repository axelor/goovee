import {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {findSubapp, findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import {PartnerKey, User} from '@/types';
import {getWhereClauseForEntity} from '@/utils/filters';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findOrder} from '@/subapps/orders/common/orm/orders';
import {ORDER} from '@/subapps/orders/common/constants/orders';
import {OrderSkeleton} from '@/subapps/orders/common/ui/components';
import {OrderType} from '@/subapps/orders/common/types/orders';

async function Order({
  params,
}: {
  params: {tenant: string; workspace: string; type: OrderType; id: string};
}) {
  const {type, id, tenant} = params;

  const session = await getSession();
  const user = session?.user as User;

  if (!user) {
    return notFound();
  }

  const {workspaceURL} = workspacePathname(params);

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) return notFound();

  const app = await findSubapp({
    code: SUBAPP_CODES.orders,
    url: workspace.url,
    user: session?.user,
    tenantId: tenant,
  });

  if (!app?.installed) {
    return notFound();
  }

  const {role, isContactAdmin} = app;

  const where = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const invoicesWhereClasuse = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.PARTNER,
  });
  const isCompleted = type === ORDER.COMPLETED ? true : false;

  const order = await findOrder({
    id,
    tenantId: tenant,
    params: {
      where,
    },
    workspaceURL,
    isCompleted,
    invoicesParams: {where: invoicesWhereClasuse},
  });

  if (!order) {
    return notFound();
  }

  return <Content order={clone(order)} orderType={type} />;
}

export default async function Page({
  params,
}: {
  params: {tenant: string; workspace: string; type: OrderType; id: string};
}) {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <Order params={params} />
    </Suspense>
  );
}
