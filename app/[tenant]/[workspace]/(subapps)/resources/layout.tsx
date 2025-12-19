import React from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findSubappAccess} from '@/orm/workspace';
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';

export default async function Layout(
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
    }>;
    children: React.ReactNode;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const {tenant} = params;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.resources,
    user: (await getSession())?.user,
    url: workspacePathname(params)?.workspaceURL,
    tenantId: tenant,
  });

  if (!subapp) return notFound();

  return <>{children}</>;
}
