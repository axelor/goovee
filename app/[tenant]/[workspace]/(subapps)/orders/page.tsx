import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {findWorkspace, findSubapp} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {getSession} from '@/auth';
import {DEFAULT_LIMIT, SUBAPP_CODES} from '@/constants';
import {manager} from '@/tenant';
import {clone} from '@/utils';
import {PartnerKey, User} from '@/types';
import {TableSkeleton} from '@/ui/components/table';
import {getWhereClauseForEntity} from '@/utils/filters';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findOrders} from '@/subapps/orders/common/orm/orders';
import {ORDER, ORDER_TAB_ITEMS} from '@/subapps/orders/common/constants/orders';
import {OrderType} from '@/subapps/orders/common/types/orders';

async function Orders({
  params,
  searchParams,
}: {
  params: {tenant: string; workspace: string};
  searchParams: {[key: string]: string | undefined};
}) {
  const {tenant: tenantId} = params;
  const {limit, page, type} = searchParams;

  const orderType = (type ?? ORDER.ONGOING) as OrderType;

  if (!ORDER_TAB_ITEMS.some(item => item.href === orderType)) {
    return notFound();
  }

  const session = await getSession();
  const user = session?.user as User;

  if (!user) {
    return notFound();
  }

  const {workspaceURL} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) return notFound();

  const app = await findSubapp({
    code: SUBAPP_CODES.orders,
    url: workspace.url,
    user: session?.user,
    client,
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

  const isCompleted = orderType === ORDER.COMPLETED;

  const result = await findOrders({
    isCompleted,
    params: {
      where,
      page,
      limit: limit ? Number(limit) : DEFAULT_LIMIT,
    },
    client,
    workspaceURL,
  });

  if (!result) {
    return notFound();
  }

  const {orders, pageInfo} = result;

  return (
    <Content orders={clone(orders)} pageInfo={pageInfo} orderType={orderType} />
  );
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Orders params={params} searchParams={searchParams} />
    </Suspense>
  );
}
