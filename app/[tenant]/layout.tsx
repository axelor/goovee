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
import {tenantConfigProvider} from '@/tenant/config-provider';
import {withBasePath} from '@/lib/core/path/base-path';

import Theme from '@/app/theme';

/* Point the manifest link at this tenant's manifest so an installed PWA starts
 * inside the tenant's service-worker scope; overrides the root manifest. */
export async function generateMetadata(props: {
  params: Promise<{tenant: string}>;
}): Promise<Metadata> {
  const {tenant} = await props.params;
  return {manifest: withBasePath(`/${tenant}/manifest.webmanifest`)};
}

export default async function TenantLayout(props: {
  params: Promise<{tenant: string}>;
  children: React.ReactNode;
}) {
  const {tenant} = await props.params;

  const [config, theme] = await Promise.all([
    tenantConfigProvider.get(tenant),
    findTheme(),
  ]);

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
