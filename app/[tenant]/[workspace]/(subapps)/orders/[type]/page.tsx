import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {findWorkspace, findSubapp} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {getSession} from '@/auth';
import {DEFAULT_LIMIT, SUBAPP_CODES} from '@/constants';
import {clone} from '@/utils';
import {PartnerKey, User} from '@/types';
import {TableSkeleton} from '@/ui/components/table';
import {getWhereClauseForEntity} from '@/utils/filters';

// ---- LOCAL IMPORTS ---- //
import Content from '@/subapps/orders/[type]/content';
import {findOrders} from '@/subapps/orders/common/orm/orders';
import {ORDER} from '@/subapps/orders/common/constants/orders';
import {OrderType} from '@/subapps/orders/common/types/orders';

async function Orders({
  params,
  searchParams,
}: {
  params: {type: OrderType; tenant: string; workspace: string};
  searchParams: {[key: string]: string | undefined};
}) {
  const {type, tenant} = params;

  const {limit, page} = searchParams;

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

  if (!app?.isInstalled) {
    return notFound();
  }

  const {role, isContactAdmin} = app;

  const where = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const isCompleted = type === ORDER.COMPLETED ? true : false;

  const result = await findOrders({
    isCompleted,
    params: {
      where,
      page,
      limit: limit ? Number(limit) : DEFAULT_LIMIT,
    },
    tenantId: tenant,
    workspaceURL,
  });

  if (!result) {
    return notFound();
  }

  const {orders, pageInfo} = result;

  return (
    <Content orders={clone(orders)} pageInfo={pageInfo} orderType={type} />
  );
}

export default async function Page({
  params,
  searchParams,
}: {
  params: {type: OrderType; tenant: string; workspace: string};
  searchParams: {[key: string]: string | undefined};
}) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Orders params={params} searchParams={searchParams} />
    </Suspense>
  );
}
