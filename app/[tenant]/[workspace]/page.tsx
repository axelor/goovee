import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findSubapps, findWorkspace, getWorkspaceConfig} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {SEARCH_PARAMS} from '@/constants';
import {getLoginURL} from '@/utils/url';
import {manager} from '@/lib/core/tenant';
import {ClientRedirection} from './client';
import {Home} from './home';

export default async function Page(props: {
  params: Promise<{workspace: string; tenant: string}>;
}) {
  const params = await props.params;
  const {tenant: tenantId} = params;
  const session = await getSession();

  const tenant = await manager.getTenant(tenantId);

  if (!tenant) {
    return notFound();
  }

  const {client} = tenant;

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
    client,
  });

  if (!workspace) {
    return user ? notFound() : redirect(loginURL);
  }

  const config = await getWorkspaceConfig(workspace.config.id, client);

  if (!config) {
    return user ? notFound() : redirect(loginURL);
  }

  const apps = await findSubapps({
    user: session?.user,
    url: workspaceURL,
    client,
  });

  if (config.isHomepageDisplay) {
    return (
      <Home
        client={client}
        user={session?.user}
        workspace={workspace}
        config={config}
        workspaceURI={workspaceURI}
        apps={apps}
      />
    );
  }

  if (!apps?.length) {
    return user ? notFound() : redirect(loginURL);
  }

  const defaultApp = apps[0];
  return <ClientRedirection url={`${workspaceURI}/${defaultApp.code}`} />;
}
