import React from 'react';

import {PushProvider} from '@/pwa/push-context';
import {SerwistProvider} from '@/pwa/serwist';
import {withBasePath} from '@/lib/core/path/base-path';

export default async function TenantLayout(props: {
  params: Promise<{tenant: string}>;
  children: React.ReactNode;
}) {
  const {tenant} = await props.params;

  /* Register the service worker scoped to this tenant (/{tenant}/) rather than
   * the whole origin. Each tenant gets its own registration — and therefore its
   * own push subscription — so per-tenant VAPID keys work on a shared origin
   * (it registers SerwistProvider before PushProvider subscribes). */
  return (
    <SerwistProvider
      swUrl={withBasePath('/sw.js')}
      options={{scope: withBasePath(`/${tenant}/`)}}>
      <PushProvider tenant={tenant}>{props.children}</PushProvider>
    </SerwistProvider>
  );
}
