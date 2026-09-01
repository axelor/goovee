/* The tenant's browser variables (Environment) are read from its config at
 * request time. force-dynamic keeps this layout from being statically rendered
 * and frozen at build, which would bake one tenant's values for everyone. */
export const dynamic = 'force-dynamic';

import React from 'react';
import type {Metadata} from 'next';

import {Environment, getPublicEnvironment} from '@/environment';
import {findTheme} from '@/orm/theme';
import {PushProvider} from '@/pwa/push-context';
import {SerwistProvider} from '@/pwa/serwist';
import {manager} from '@/tenant';
import {tenantConfigProvider} from '@/tenant/config-provider';
import {isHostRouted} from '@/lib/core/tenant/routing';
import {withBasePath} from '@/lib/core/path/base-path';

import Theme from '@/app/theme';

/* Point the manifest link at this tenant's manifest, so installing from one of
 * its pages installs an app that launches into this tenant; overrides the root
 * manifest. A segment naming no configured tenant keeps the root manifest, since
 * the per-tenant address answers 404: metadata is resolved from the segments an
 * address matched, so `/<segment>/<workspace>` resolves this one whatever it ends
 * up rendering. */
export async function generateMetadata(props: {
  params: Promise<{tenant: string}>;
}): Promise<Metadata> {
  const {tenant} = await props.params;
  const knownTenantIds = manager.listTenantIds();

  if (!knownTenantIds.includes(tenant)) return {};

  return {manifest: withBasePath(`/${tenant}/manifest.webmanifest`)};
}

export default async function TenantLayout(props: {
  params: Promise<{tenant: string}>;
  children: React.ReactNode;
}) {
  const {tenant} = await props.params;

  const config = tenantConfigProvider.get(tenant);
  const theme = await findTheme();

  const env = getPublicEnvironment(config);

  /* Register one service worker per tenant, so each holds a push subscription of
   * its own and a per-tenant VAPID key takes effect (it registers SerwistProvider
   * before PushProvider subscribes). Environment wraps both, since PushProvider
   * reads the VAPID public key from it.
   *
   * The scope is the narrowest one covering the tenant's addresses: the tenant
   * path segment where an origin carries several tenants, and the root of the
   * origin where the tenant is reached by host and holds it alone. A browser
   * installs an app only where the page's worker encloses its scope and start
   * address, and scopes match by path prefix, so this has to be no narrower than
   * the manifest asks for.
   *
   * The tenant is named in the worker's own address because its scope no longer
   * always carries it, and the worker needs it to keep its caches and its
   * notification channel to itself. */
  const scope = withBasePath(
    config && isHostRouted(config) ? '/' : `/${tenant}/`,
  );

  return (
    <Environment value={env}>
      <Theme theme={theme}>
        <SerwistProvider
          swUrl={`${withBasePath('/sw.js')}?tenant=${encodeURIComponent(tenant)}`}
          options={{scope}}>
          <PushProvider tenant={tenant}>{props.children}</PushProvider>
        </SerwistProvider>
      </Theme>
    </Environment>
  );
}
