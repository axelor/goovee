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

  /* Register the service worker scoped to this tenant (/{tenant}/) rather than
   * the whole origin. Each tenant gets its own registration — and therefore its
   * own push subscription — so per-tenant VAPID keys work on a shared origin
   * (it registers SerwistProvider before PushProvider subscribes). Environment
   * wraps both, since PushProvider reads the VAPID public key from it. */
  return (
    <Environment value={env}>
      <Theme theme={theme}>
        <SerwistProvider
          swUrl={withBasePath('/sw.js')}
          options={{scope: withBasePath(`/${tenant}/`)}}>
          <PushProvider tenant={tenant}>{props.children}</PushProvider>
        </SerwistProvider>
      </Theme>
    </Environment>
  );
}
