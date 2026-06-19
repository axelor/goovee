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

  const session = await getSession();
  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  await requireSubappAccess({
    code: SUBAPP_CODES.orders,
    url: workspaceURL,
    user,
    client,
    workspaceURI,
    tenantId,
  });

  return <div className="!mb-20 md:mb-0">{children}</div>;
}
