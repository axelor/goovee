import React from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {requireSubappAccess} from '@/lib/core/workspace/subapp-access';
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import {manager} from '@/tenant';

export default async function Layout(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
  }>;
  children: React.ReactNode;
}) {
  const params = await props.params;

  const {children} = props;

  const {tenant: tenantId} = params;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  await requireSubappAccess({
    code: SUBAPP_CODES.resources,
    url: workspaceURL,
    user: (await getSession())?.user,
    client,
    workspaceURI,
    tenantId,
  });

  return <>{children}</>;
}
