import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findSubapps} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {SEARCH_PARAMS} from '@/constants';
import {getLoginURL} from '@/utils/url';
import {ensureWorkspaceAccess} from '@/lib/core/access/ensure-workspace-access';
import {getShellConfig} from './orm/config';
import {ClientRedirection} from './client';
import {Home} from './home';

export default async function Page(props: {
  params: Promise<{workspace: string; tenant: string}>;
}) {
  const access = await ensureWorkspaceAccess({allowGuest: true});

  if (!access.ok) {
    /* Only an absent session is sent to login, and the gate returns that reason
     * only for a workspace it has confirmed exists — so nobody is asked to sign
     * in to reach an address that names nothing. The callback comes from the
     * address rather than the gate, which resolved no workspace to build one
     * from. */
    if (access.reason === 'unauthenticated') {
      const {workspaceURI, tenant} = workspacePathname(await props.params);

      redirect(
        getLoginURL({
          callbackurl: workspaceURI,
          workspaceURI,
          [SEARCH_PARAMS.TENANT_ID]: tenant,
        }),
      );
    }

    notFound();
  }

  const {user, tenant, workspace, url} = access;
  const {client} = tenant;

  const tenantId = tenant.id;
  const workspaceURL = workspace.url;
  const workspaceURI = url.forRouter();

  const loginURL = getLoginURL({
    callbackurl: workspaceURI,
    workspaceURI,
    [SEARCH_PARAMS.TENANT_ID]: tenantId,
  });

  const config = await getShellConfig(workspace.config.id, client);

  if (!config) {
    return user ? notFound() : redirect(loginURL);
  }

  const apps = await findSubapps({
    user,
    url: workspaceURL,
    client,
  });

  if (config.isHomepageDisplay) {
    return (
      <Home
        client={client}
        user={user}
        workspace={workspace}
        config={config}
        url={url}
        apps={apps}
      />
    );
  }

  if (!apps?.length) {
    return user ? notFound() : redirect(loginURL);
  }

  const defaultApp = apps[0];
  return <ClientRedirection url={url.forRouter(`/${defaultApp.code}`)} />;
}
