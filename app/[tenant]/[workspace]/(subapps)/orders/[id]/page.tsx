import {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {SUBAPP_CODES} from '@/constants';
import {PartnerKey} from '@/types';
import {getWhereClauseForEntity} from '@/utils/filters';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findOrder} from '@/subapps/orders/common/orm/orders';
import {OrderSkeleton} from '@/subapps/orders/common/ui/components';

async function Order({
  params,
}: {
  params: {tenant: string; workspace: string; id: string};
}) {
  const {id} = params;
  const access = await ensureAccess({
    code: SUBAPP_CODES.orders,
    allowGuest: false,
  });

  if (!access.ok) return denyPage(access);

  const {user} = access;

  const workspaceURL = access.workspace.url;
  const {client} = access.tenant;

  const {role, isContactAdmin} = access.subapp;

  const where = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const invoicesWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.PARTNER,
  });

  const order = await findOrder({
    id,
    client,
    params: {where},
    workspaceURL,
    invoicesParams: {where: invoicesWhereClause},
  });

  if (!order) {
    return notFound();
  }

  return <Content order={clone(order)} />;
}

export default async function Page(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    id: string;
  }>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <Order params={params} />
    </Suspense>
  );
}
