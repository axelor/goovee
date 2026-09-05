import React from 'react';
import {redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {currentWorkspace} from '@/lib/core/url/current';
import {getLoginURL} from '@/utils/login-url';
import {currentTenantScope} from '@/lib/core/url/current';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const {children} = props;

  const session = await getSession();

  if (!session?.user) {
    const scope = await currentWorkspace();

    redirect(
      getLoginURL(await currentTenantScope(), {
        workspaceURI: scope?.forRouter(),
      }),
    );
  }

  return (
    <div className="container flex flex-col gap-6 mx-auto">{children}</div>
  );
}
