/* The tenant's browser variables (Environment) are read from its config at
 * request time. force-dynamic keeps this layout from being statically rendered
 * and frozen at build, which would bake one tenant's values for everyone. */
export const dynamic = 'force-dynamic';

import React from 'react';
import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {Environment} from '@/environment';
import {findTheme} from '@/orm/theme';
import {PushProvider} from '@/pwa/push-context';
import {SerwistProvider} from '@/pwa/serwist';
import {getTenantConfig, listTenantIds} from '@/tenant/config';
import {tenantURLs} from '@/lib/core/url/scope';
import {TenantProvider} from '@/lib/core/url/tenant-context';
import {withBasePath} from '@/lib/core/path/base-path';

import Theme from '@/app/theme';
import Locale from '@/app/locale';
import {AuthClientProvider} from '@/lib/auth-client';

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

  /* A segment naming no tenant the document holds is answered by the deployment,
   * not by this shell. Refused here so it is refused once, for everything below:
   * without it a sign-in screen renders in full for a tenant that does not
   * exist, and submitting it posts to an endpoint that answers not-found — a
   * form that looks live and cannot work. Raised from the layout, so the
   * deployment's screen answers rather than the tenant's, whose way back would
   * point at the same segment that resolved nothing. */
  const config = getTenantConfig(tenant);

  if (!config) {
    notFound();
  }

  const theme = await findTheme();

  const env = config.public;

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
  const requestHeaders = await headers();
  const urls = tenantURLs(tenant);

  /* Where this tenant's addresses start on the origin this request arrived at.
   * Handed to the browser so every address it builds is measured from the same
   * place the worker below is scoped to. */
  const visitorPrefix = urls.visitorPrefix(requestHeaders);

  /* The authentication endpoint and the translations are both one tenant's, so
   * both are bound here rather than in the shell above: a page below this point
   * always has a tenant, and no client navigation can carry it out to a shell
   * that chose neither. `AuthClientProvider` wraps `Locale` because `Locale`
   * reads the session to pick a locale.
   *
   * `TenantProvider` is above them because `Locale` takes the tenant's addresses
   * from it — a scope carries methods, and those do not cross from a server
   * component to a client one, so the prefix is passed and the scope rebuilt. */
  return (
    <Environment value={env}>
      <TenantProvider
        tenantId={tenant}
        visitorPrefix={visitorPrefix}
        host={env.host}>
        <AuthClientProvider visitorPrefix={visitorPrefix}>
          <Locale>
            <Theme theme={theme}>
              <SerwistProvider
                swUrl={`${withBasePath('/sw.js')}?tenant=${encodeURIComponent(tenant)}`}
                options={{scope: urls.entry(requestHeaders)}}>
                <PushProvider tenant={tenant}>{props.children}</PushProvider>
              </SerwistProvider>
            </Theme>
          </Locale>
        </AuthClientProvider>
      </TenantProvider>
    </Environment>
  );
}
