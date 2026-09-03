import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {findSubappAccess} from '@/orm/workspace';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {getShopConfig} from '@/subapps/shop/common/orm/config';
import {shouldHidePricesAndPurchase} from '@/orm/product';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    allowGuest: false,
  });

  if (!access.ok) return denyPage(access);

  const {user} = access;
  const {client} = access.tenant;

  const workspaceURL = access.workspace.url;

  const config = await getShopConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  if (!config?.requestQuotation) {
    redirect(access.scope.forRouter('/shop/cart'));
  }

  const quotationSubapp = await findSubappAccess({
    code: SUBAPP_CODES.quotations,
    user,
    url: workspaceURL,
    client,
  });

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    config,
    client,
  });

  if (hidePriceAndPurchase) notFound();
  return <Content quotationSubapp={Boolean(quotationSubapp)} />;
}
