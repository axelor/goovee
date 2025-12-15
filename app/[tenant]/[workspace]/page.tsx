import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findSubapps, findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {SEARCH_PARAMS} from '@/constants';
import {getLoginURL} from '@/utils/url';
import {ClientRedirection} from './client';
import {Home} from './home';

export default async function Page({
  params,
}: {
  params: {workspace: string; tenant: string};
}) {
  const {tenant} = params;
  const session = await getSession();

  const {workspaceURL, workspaceURI} = workspacePathname(params);
  const user = session?.user;

  const loginURL = getLoginURL({
    callbackurl: workspaceURI,
    workspaceURI,
    [SEARCH_PARAMS.TENANT_ID]: tenant,
  });

  if (!workspaceURL) {
    return user ? notFound() : redirect(loginURL);
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  });

  if (!workspace) {
    return user ? notFound() : redirect(loginURL);
  }

  const apps = await findSubapps({
    user: session?.user,
    url: workspaceURL,
    tenantId: tenant,
  });

  if (workspace.config?.isHomepageDisplay) {
    return (
      <Home
        tenant={tenant}
        user={session?.user}
        workspace={workspace}
        workspaceURI={workspaceURI}
        apps={apps}
      />
    );
  }

  if (!apps?.length) {
    return user ? notFound() : redirect(loginURL);
  }

  const defaultApp = apps[0];
  return <ClientRedirection url={`${workspaceURL}/${defaultApp.code}`} />;
}
