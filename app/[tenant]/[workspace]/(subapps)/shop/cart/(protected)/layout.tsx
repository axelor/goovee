import React from 'react';
import {redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {SEARCH_PARAMS} from '@/constants';

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: {tenant: string; workspace: string};
}) {
  const {tenant} = params;
  const session = await getSession();

  const {workspaceURI} = workspacePathname(params);

  if (!session?.user) {
    redirect(
      `/auth/login?workspaceURI=${encodeURIComponent(workspaceURI)}&${SEARCH_PARAMS.TENANT_ID}=${encodeURIComponent(tenant)}`,
    );
  }

  return (
    <div className="container flex flex-col gap-6 mx-auto">{children}</div>
  );
}
