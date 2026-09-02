/* The tenant's browser variables (Environment) are read from its config at
 * request time. force-dynamic keeps this layout from being statically rendered
 * and frozen at build, which would bake one tenant's values for everyone. */
export const dynamic = 'force-dynamic';

import React from 'react';
import type {Metadata} from 'next';
import {headers} from 'next/headers';

import {Environment, getPublicEnvironment} from '@/environment';
import {findTheme} from '@/orm/theme';
import {PushProvider} from '@/pwa/push-context';
import {SerwistProvider} from '@/pwa/serwist';
import {getTenantConfig, listTenantIds} from '@/tenant/config';
import {tenantURLs} from '@/lib/core/url/scope';
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
  const knownTenantIds = listTenantIds();

  if (!knownTenantIds.includes(tenant)) return {};

  return {manifest: tenantURLs(tenant).manifest()};
}

export default async function TenantLayout(props: {
  params: Promise<{tenant: string}>;
  children: React.ReactNode;
}) {
  const {tenant} = await props.params;

  const config = getTenantConfig(tenant);
  const theme = await findTheme();

  const env = getPublicEnvironment(config);

  /* Register one service worker per tenant, so each holds a push subscription of
   * its own and a per-tenant VAPID key takes effect (it registers SerwistProvider
   * before PushProvider subscribes). Environment wraps both, since PushProvider
   * reads the VAPID public key from it.
   *
   * The scope is the tenant's entry address, the same value the manifest route
   * serves as the app's entry — one function answers both, because a browser
   * installs an app only where the page's worker encloses the manifest's scope
   * and start address.
   *
   * The tenant is named in the worker's own address, since a scope of `/` names
   * none, and the worker needs it to keep its caches and its notification channel
   * to itself. */
  const scope = tenantURLs(tenant).entry(await headers());

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
