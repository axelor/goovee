import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {findSubappAccess} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {getShopConfig} from '@/subapps/shop/common/orm/config';
import {shouldHidePricesAndPurchase} from '@/orm/product';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
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

  const config = await getShopConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  if (!config?.requestQuotation) {
    redirect(`${workspaceURI}/shop/cart`);
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
