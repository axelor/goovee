import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace, findSubappAccess} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {shouldHidePricesAndPurchase} from '@/orm/product';

export default async function Page(
  props: {
    params: Promise<{tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  const {tenant} = params;
  const session = await getSession();

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace?.config?.requestQuotation) {
    redirect(`${workspaceURI}/shop/cart`);
  }

  const quotationSubapp = await findSubappAccess({
    code: SUBAPP_CODES.quotations,
    user: session?.user,
    url: workspaceURL,
    tenantId: tenant,
  });

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user: session?.user,
    workspace,
    tenantId: tenant,
  });

  if (hidePriceAndPurchase) notFound();
  return (
    <Content workspace={workspace} quotationSubapp={Boolean(quotationSubapp)} />
  );
}
