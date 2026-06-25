import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
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
