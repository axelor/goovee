import React from 'react';
import type {Metadata} from 'next';
import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {currentWorkspace} from '@/lib/core/url/current';
import {findWorkspaces, findSubapps} from '@/orm/workspace';
import {DEFAULT_THEME_OPTIONS} from '@/constants/theme';
import {NAVIGATION, SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {getLoginURL} from '@/utils/url';
import {ensureWorkspaceAccess} from '@/lib/core/access/ensure-workspace-access';
import {tenantURLs} from '@/lib/core/url/scope';
import {getPortalRoot} from '@/utils/workspace-url';
import {getPublicEnvironment} from '@/environment';

// ---- LOCAL IMPORTS ---- //
import {getShellConfig} from './orm/config';
import WorkspaceProvider from './workspace-context';
import type {WorkspaceLink} from './workspace-links';
import CartProvider from '@/app/[tenant]/[workspace]/cart/cart-provider';
import Header from './header';
import Sidebar from './sidebar';
import MobileMenu from './mobile-menu';
import Footer from './footer';
import {shouldHidePricesAndPurchase} from '@/orm/product';

const defaultTheme = {
  id: -1,
  name: 'Default Theme',
  css: JSON.stringify(DEFAULT_THEME_OPTIONS),
};

export async function generateMetadata(): Promise<Metadata | null> {
  const granted = await ensureWorkspaceAccess({allowGuest: true});

  /* A title is the only thing at stake, so every denial and an unnamed
   * workspace answer the same way: no metadata, and the page still renders. */
  if (!granted.ok || !granted.workspace.name) {
    return null;
  }

  return {
    title: granted.workspace.name,
  };
}

export default async function Layout(props: {
  params: Promise<{tenant: string; workspace: string}>;
  children: React.ReactNode;
}) {
  const {children} = props;

  const granted = await ensureWorkspaceAccess({allowGuest: true});

  if (!granted.ok) {
    /* Only an absent session is sent to login, and the gate returns that reason
     * only for a workspace it has confirmed exists — so nobody is asked to sign
     * in to reach an address that names nothing. A denial carries no addresses
     * even so, which is why the workspace is read from the address the request
     * arrived at rather than taken from the gate. */
    if (granted.reason === 'unauthenticated') {
      const scope = await currentWorkspace();
      const workspaceURI = scope?.forRouter();

      redirect(
        getLoginURL({
          callbackurl: workspaceURI,
          workspaceURI,
          [SEARCH_PARAMS.TENANT_ID]: scope?.tenantId,
        }),
      );
    }

    notFound();
  }

  const {user, tenant, url} = granted;
  const {client} = tenant;
  const $workspace = clone(granted.workspace);

  const tenantId = tenant.id;
  const workspaceURI = url.forRouter();

  const config = await getShellConfig($workspace.config.id, client);

  if (!config) {
    return user
      ? notFound()
      : redirect(
          getLoginURL({
            callbackurl: workspaceURI,
            workspaceURI,
            [SEARCH_PARAMS.TENANT_ID]: tenantId,
          }),
        );
  }

  const host = getPublicEnvironment(tenant.config).GOOVEE_PUBLIC_HOST!;
  const baseUrl = getPortalRoot(host);

  const found = await findWorkspaces({
    url: baseUrl,
    user,
    client,
  })
    .then(clone)
    .then(list => list.filter((w): w is NonNullable<typeof w> => w != null));

  /* Each switcher gets an address rather than a stored key: only the tenant's
   * configuration knows whether its addresses carry a tenant segment, and the
   * browser has no reason to hold the value AOS identifies a workspace by. A
   * workspace with no stored url cannot be addressed at all, so it is left out
   * instead of offered as a link to nowhere. */
  const tenantScope = tenantURLs(tenantId);
  const workspaces: WorkspaceLink[] = found
    .filter(w => Boolean(w.url))
    .map(w => ({
      id: w.id,
      name: w.name,
      href: tenantScope.workspaceByKey(w.url!).forRouter(),
    }));

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
    client,
  });

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    config,
    client,
  });

  const navigationSelect = $workspace?.navigationSelect || NAVIGATION.left;
  const isTopNavigation = navigationSelect === NAVIGATION.top;
  const isLeftNavigation = navigationSelect === NAVIGATION.left;

  const shopSubapp = subapps?.find(
    (app: any) => app.code === SUBAPP_CODES.shop,
  );
  const marketplaceSubapp = subapps?.find(
    (app: any) => app.code === SUBAPP_CODES.marketplace,
  );

  /* Cart codes the unified cart icon should show, in priority order. Each entry
   * has a matching descriptor in app/[tenant]/[workspace]/cart/descriptors. */
  const cartCodes: string[] = [];
  if (!hidePriceAndPurchase && shopSubapp?.isInstalled) {
    cartCodes.push(SUBAPP_CODES.shop);
  }
  if (marketplaceSubapp?.isInstalled) {
    cartCodes.push(SUBAPP_CODES.marketplace);
  }

  return (
    <WorkspaceProvider
      id={$workspace.id}
      workspace={url.workspace}
      workspaceURI={workspaceURI}
      tenant={tenantId}
      theme={theme}>
      <CartProvider>
        <div className="h-full w-full flex min-h-screen">
          {isLeftNavigation && (
            <Sidebar
              subapps={subapps}
              workspaces={workspaces}
              showHome={config.isHomepageDisplay}
              config={clone(config)}
            />
          )}
          <div className="flex flex-col flex-1 max-h-full max-w-full min-w-0">
            <Header
              subapps={subapps}
              isTopNavigation={isTopNavigation}
              workspaces={workspaces}
              workspace={$workspace}
              config={clone(config)}
              cartCodes={cartCodes}
            />
            <div className="flex flex-col flex-grow min-h-0">
              <div className="flex flex-col flex-grow min-h-0">{children}</div>
              <Footer config={clone(config)} />
            </div>
          </div>
          <MobileMenu
            subapps={subapps}
            workspaces={workspaces}
            workspace={$workspace}
            config={clone(config)}
            cartCodes={cartCodes}
          />
        </div>
      </CartProvider>
    </WorkspaceProvider>
  );
}
