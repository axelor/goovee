import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import type {Cart} from '@/types';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {CartSkeleton} from '@/subapps/shop/common/ui/components';
import {shouldHidePricesAndPurchase} from '@/orm/product';
import {notFound} from 'next/navigation';

async function CartView({
  params,
}: {
  params: {tenant: string; workspace: string};
}) {
  const {tenant} = params;
  const session = await getSession();

  const {workspaceURL} = workspacePathname(params);

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user: session?.user,
    workspace,
    tenantId: tenant,
  });

  if (hidePriceAndPurchase) notFound();
  return <Content workspace={workspace} tenant={tenant} />;
}

export default async function Cart(
  props: {
    params: Promise<{tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  return (
    <Suspense fallback={<CartSkeleton />}>
      <CartView params={params} />
    </Suspense>
  );
}
