import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {DEFAULT_LIMIT, SUBAPP_CODES} from '@/constants';
import {clone} from '@/utils';
import {PartnerKey} from '@/types';
import {SplitViewListSkeleton} from '@/ui/components/record-skeleton';
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
  const {limit, page, type, search} = searchParams;

  const orderType = (type ?? ORDER.ONGOING) as OrderType;

  if (!ORDER_TAB_ITEMS.some(item => item.href === orderType)) {
    return notFound();
  }
  const access = await ensureAccess({
    code: SUBAPP_CODES.orders,
    allowGuest: false,
  });

  if (!access.ok) return denyPage(access);

  const {user} = access;

  const workspaceURL = access.workspace.url;
  const {client} = access.tenant;

  const {role, isContactAdmin} = access.subapp;

  const searchTerm = search?.trim();

  const where = {
    ...getWhereClauseForEntity({
      user,
      role,
      isContactAdmin,
      partnerKey: PartnerKey.CLIENT_PARTNER,
    }),
    ...(searchTerm ? {saleOrderSeq: {like: `%${searchTerm}%`}} : {}),
  };

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
    <Suspense fallback={<SplitViewListSkeleton />}>
      <Orders params={params} searchParams={searchParams} />
    </Suspense>
  );
}
