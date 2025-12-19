import {Suspense} from 'react';
import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {CheckoutSkeleton} from '@/subapps/shop/common/ui/components';
import {shouldHidePricesAndPurchase} from '@/orm/product';

async function Checkout({
  params,
}: {
  params: {tenant: string; workspace: string};
}) {
  const {tenant} = params;

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace?.config?.confirmOrder) {
    redirect(`${workspaceURI}/shop/cart`);
  }

  const orderSubapp = await findSubappAccess({
    code: SUBAPP_CODES.orders,
    user,
    url: workspaceURL,
    tenantId: tenant,
  });

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
    tenantId: tenant,
  });

  if (hidePriceAndPurchase) notFound();

  return (
    <Content workspace={workspace} orderSubapp={orderSubapp} tenant={tenant} />
  );
}

export default async function Page(
  props: {
    params: Promise<{tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <Checkout params={params} />
    </Suspense>
  );
}
