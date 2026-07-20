export const dynamic = 'force-dynamic';

import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {
  findWorkspaces,
  findSubapps,
  findDefaultPartnerWorkspace,
} from '@/orm/workspace';
import {getSession} from '@/auth';
import {getPublicEnvironment} from '@/environment';
import {clone, getPartnerId} from '@/utils';
import {TenancyType, manager} from '@/tenant';
import {DEFAULT_TENANT} from '@/constants';
import {getBasePath, withBasePath} from '@/lib/core/path/base-path';

export default async function Page(props: {
  searchParams: Promise<{workspaceURI?: string; tenant?: string}>;
}) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  const user = session?.user;

  let tenantId = decodeURIComponent(searchParams.tenant || '');

  if (!tenantId && manager.getType() === TenancyType.single) {
    tenantId = DEFAULT_TENANT;
  }

  const knownTenantIds = await manager.listTenantIds();

  if (!tenantId || !knownTenantIds.includes(tenantId)) {
    return notFound();
  }

  const tenant = await manager.getTenant(tenantId);

  if (!tenant) {
    return notFound();
  }

  const {client} = tenant;

  const host = getPublicEnvironment(tenant.config).GOOVEE_PUBLIC_HOST!;
  const baseUrl = `${host}${getBasePath()}`;

  const workspaces = await findWorkspaces({
    url: baseUrl,
    user,
    client,
  });

  if (!workspaces?.length) {
    return notFound();
  }

  const workspaceURI = decodeURIComponent(searchParams.workspaceURI || '');

  if (workspaceURI) {
    const url = `${host}${withBasePath(workspaceURI)}`;

    const workspaceApps = await findSubapps({
      user,
      url,
      client,
    }).then(clone);

    if (workspaceApps?.length) {
      return redirect(`${url}/${workspaceApps[0].code}`);
    }
  }

  let redirectURL;

  if (user) {
    const partnerId = getPartnerId(user);

    const defaultWorkspace = await findDefaultPartnerWorkspace({
      partnerId,
      client,
    });

    if (defaultWorkspace?.workspace?.url) {
      const url = defaultWorkspace.workspace.url;
      const apps = await findSubapps({url, user, client});
      if (apps?.length) {
        redirectURL = `${url}/${apps[0].code}`;
      }
    }
  }

  if (!redirectURL) {
    for (const w of workspaces) {
      const apps = await findSubapps({url: w.url!, user, client});
      if (apps?.length) {
        redirectURL = `${w.url}/${apps[0].code}`;
        break;
      }
    }
  }

  if (!redirectURL) {
    notFound();
  }

  return redirect(redirectURL);
}
