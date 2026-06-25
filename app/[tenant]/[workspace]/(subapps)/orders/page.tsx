import {notFound, redirect, unauthorized} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {DEFAULT_LIMIT, SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {clone} from '@/utils';
import {PartnerKey} from '@/types';
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
  const {limit, page, type} = searchParams;

  const orderType = (type ?? ORDER.ONGOING) as OrderType;

  if (!ORDER_TAB_ITEMS.some(item => item.href === orderType)) {
    return notFound();
  }

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAuth({
    code: SUBAPP_CODES.orders,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: false,
  });

  if (!access.ok) {
    if (
      access.reason === 'workspace-not-found' ||
      access.reason === 'app-not-installed'
    ) {
      notFound();
    }
    if (!access.user) {
      redirect(
        getLoginURL({
          callbackurl: await getCurrentPath(),
          workspaceURI,
          [SEARCH_PARAMS.TENANT_ID]: tenant,
        }),
      );
    }
    unauthorized();
  }

  const {user, client} = access;

  const {role, isContactAdmin} = access.subapp;

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
