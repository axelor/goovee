import React from 'react';

import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace, findSubapp} from '@/orm/workspace';
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //

export default async function Layout({
  params,
  children,
}: {
  params: {
    tenant: string;
    workspace: string;
  };
  children: React.ReactNode;
}) {
  const session = await getSession();

  const {workspaceURL, tenant} = workspacePathname(params);

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const app = await findSubapp({
    code: SUBAPP_CODES.chat,
    url: workspace.url,
    user: session?.user,
    tenantId: tenant,
  });

  if (!app?.isInstalled) {
    return notFound();
  }

  return <>{children}</>;
}
