import React from 'react';
import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace, findWorkspaces, findSubapps} from '@/orm/workspace';
import {DEFAULT_THEME_OPTIONS} from '@/constants/theme';
import {NAVIGATION, SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {getLoginURL} from '@/utils/url';

// ---- LOCAL IMPORTS ---- //
import Workspace from './workspace-context';
import CartContext from './cart-context';
import Header from './header';
import Sidebar from './sidebar';
import MobileMenu from './mobile-menu';
import AnonymousSignOut from './anonymous-signout';
import Footer from './footer';
import {shouldHidePricesAndPurchase} from '@/orm/product';

const defaultTheme = {
  id: -1,
  name: 'Default Theme',
  css: JSON.stringify(DEFAULT_THEME_OPTIONS),
};

export async function generateMetadata({
  params,
}: {
  params: {
    tenant: string;
    workspace: string;
    websiteSlug: string;
  };
}) {
  const {workspaceURL, tenant} = workspacePathname(params);

  const session = await getSession();
  const user = session?.user;

  const $workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  });

  if (!$workspace?.name) {
    return null;
  }

  return {
    title: $workspace?.name,
  };
}

export default async function Layout({
  params,
  children,
}: {
  params: {tenant: string; workspace: string};
  children: React.ReactNode;
}) {
  const {tenant} = params;
  const session = await getSession();
  const user = session?.user;

  const {workspaceURL, workspaceURI, workspace} = workspacePathname(params);

  if (user && !user?.id) {
    /**
     * Remove tenative login using oauth for registration
     */
    return <AnonymousSignOut callbackurl={workspaceURL} />;
  }

  const $workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!$workspace) {
    return user
      ? notFound()
      : redirect(
          getLoginURL({
            callbackurl: workspaceURI,
            workspaceURI,
            [SEARCH_PARAMS.TENANT_ID]: tenant,
          }),
        );
  }

  const workspaces = await findWorkspaces({
    url: process.env.GOOVEE_PUBLIC_HOST,
    user,
    tenantId: tenant,
  }).then(clone);

  let theme: any;
  try {
    theme = $workspace?.theme || defaultTheme;
    theme.options = JSON.parse(theme?.css);
  } catch (err: any) {
    console.error(err?.message);
  }

  const subapps = await findSubapps({
    url: $workspace?.url,
    user,
    tenantId: tenant,
  });

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace: $workspace,
    tenantId: tenant,
  });

  const navigationSelect = $workspace?.navigationSelect || NAVIGATION.left;
  const isTopNavigation = navigationSelect === NAVIGATION.top;
  const isLeftNavigation = navigationSelect === NAVIGATION.left;

  const shopSubapp = subapps?.find(
    (app: any) => app.code === SUBAPP_CODES.shop,
  );
  const showCart = !hidePriceAndPurchase && shopSubapp?.installed;

  return (
    <Workspace
      id={$workspace.id}
      workspace={workspace}
      tenant={tenant}
      theme={theme}>
      <CartContext>
        <div className="h-full w-full flex min-h-screen">
          {isLeftNavigation && (
            <Sidebar subapps={subapps} workspaces={workspaces} />
          )}
          <div className="flex flex-col flex-1 max-h-full max-w-full min-w-0">
            <Header
              subapps={subapps}
              isTopNavigation={isTopNavigation}
              workspaces={workspaces}
              workspace={$workspace}
              showCart={showCart}
            />
            <div className="flex flex-col flex-grow min-h-0">
              <div className="flex-grow">{children}</div>
              <Footer workspace={$workspace} />
            </div>
          </div>
          <MobileMenu
            subapps={subapps}
            workspaces={workspaces}
            workspace={$workspace}
            showCart={showCart}
          />
        </div>
      </CartContext>
    </Workspace>
  );
}
