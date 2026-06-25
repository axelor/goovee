import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getWorkspaceConfig} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {CartSkeleton} from '@/subapps/shop/common/ui/components';
import {shouldHidePricesAndPurchase} from '@/orm/product';
import {notFound, redirect, unauthorized} from 'next/navigation';

async function CartView({
  params,
}: {
  params: {tenant: string; workspace: string};
}) {
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAuth({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
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

  const {user} = access;
  const {client} = access.tenant;

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  const workspace = clone({...access.workspace, config});

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    config: workspace.config,
    client,
  });

  if (hidePriceAndPurchase) notFound();
  return <Content config={workspace.config} tenant={tenant} />;
}

export default async function Cart(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<CartSkeleton />}>
      <CartView params={params} />
    </Suspense>
  );
}
