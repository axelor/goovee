import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {findSubappAccess, getWorkspaceConfig} from '@/orm/workspace';
import {clone} from '@/utils';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {CheckoutSkeleton} from '@/subapps/shop/common/ui/components';
import {shouldHidePricesAndPurchase} from '@/orm/product';

async function Checkout({
  params,
}: {
  params: {tenant: string; workspace: string};
}) {
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAuth({
    code: SUBAPP_CODES.shop,
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

  const {user} = access;
  const {client} = access.tenant;

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  const workspace = clone({...access.workspace, config});

  if (!workspace?.config?.confirmOrder) {
    redirect(`${workspaceURI}/shop/cart`);
  }

  const orderSubapp = await findSubappAccess({
    code: SUBAPP_CODES.orders,
    user,
    url: workspaceURL,
    client,
  });

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
    client,
  });

  if (hidePriceAndPurchase) notFound();

  return (
    <Content workspace={workspace} orderSubapp={orderSubapp} tenant={tenant} />
  );
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <Checkout params={params} />
    </Suspense>
  );
}
