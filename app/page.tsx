export const dynamic = 'force-dynamic';

import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {
  findWorkspaces,
  findSubapps,
  findDefaultPartnerWorkspace,
} from '@/orm/workspace';
import {getSession} from '@/auth';
import {clone, getPartnerId} from '@/utils';
import {TenancyType, manager} from '@/tenant';
import {DEFAULT_TENANT} from '@/constants';

export default async function Page({
  searchParams,
}: {
  searchParams: {workspaceURI?: string; tenant?: string};
}) {
  const session = await getSession();
  const user = session?.user;

  let tenantId = decodeURIComponent(searchParams.tenant || '');

  if (!tenantId && manager.getType() === TenancyType.single) {
    tenantId = DEFAULT_TENANT;
  }

  if (!tenantId) {
    return notFound();
  }

  const workspaces = await findWorkspaces({
    url: process.env.GOOVEE_PUBLIC_HOST,
    user,
    tenantId,
  });

  if (!workspaces?.length) {
    return notFound();
  }

  const workspaceURI = decodeURIComponent(searchParams.workspaceURI || '');

  if (workspaceURI) {
    const url = `${process.env.GOOVEE_PUBLIC_HOST}${decodeURIComponent(workspaceURI)}`;

    const workspaceApps = await findSubapps({
      user,
      url,
      tenantId,
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
      tenantId,
    });

    if (defaultWorkspace?.workspace?.url) {
      const url = defaultWorkspace?.workspace?.url;
      const apps = await findSubapps({url, user, tenantId});
      if (apps?.length) {
        redirectURL = `${url}/${apps[0].code}`;
      }
    }
  }

  if (!redirectURL) {
    for (const w of workspaces) {
      const apps = await findSubapps({url: w.url!, user, tenantId});
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
