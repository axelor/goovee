import React from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {requireSubappAccess} from '@/lib/core/workspace/subapp-access';
import {findWorkspace} from '@/orm/workspace';
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import {manager} from '@/lib/core/tenant';

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

  if (!tenant) {
    return notFound();
  }

  const {client} = tenant;
  const session = await getSession();

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    client,
  });

  if (!workspace) return notFound();

  await requireSubappAccess({
    code: SUBAPP_CODES.quotations,
    url: workspaceURL,
    user: session?.user,
    client,
    workspaceURI,
    tenantId,
  });

  return <div className="!mb-20 md:mb-0">{children}</div>;
}
