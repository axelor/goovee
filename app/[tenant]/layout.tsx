import React from 'react';
import {PushProvider} from '@/pwa/push-context';

export default async function TenantLayout(props: {
  params: Promise<{tenant: string}>;
  children: React.ReactNode;
}) {
  const {tenant} = await props.params;

  return <PushProvider tenant={tenant}>{props.children}</PushProvider>;
}
