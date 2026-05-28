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
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findOrder} from '@/subapps/orders/common/orm/orders';
import {OrderSkeleton} from '@/subapps/orders/common/ui/components';

async function Order({
  params,
}: {
  params: {tenant: string; workspace: string; id: string};
}) {
  const {id, tenant: tenantId} = params;

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
