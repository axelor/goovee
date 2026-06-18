import type {Client} from '@/goovee/.generated/client';
import {getSession} from '@/auth';
import {getPublicEnvironment} from '@/environment';
import {getTenantConfigSync} from '@/tenant/config-provider';
import {findWorkspaces} from '@/orm/workspace';
import {clone} from '@/utils';
import {getPortalRoot} from '@/utils/workspace';

export function extractSearchParams({
  searchParams,
}: {
  searchParams: {
    workspaceURI?: string;
    tenant?: string;
  };
}) {
  const workspaceURI =
    searchParams?.workspaceURI && decodeURIComponent(searchParams.workspaceURI);

  const tenantId =
    searchParams?.tenant && decodeURIComponent(searchParams.tenant);

  const config = tenantId ? getTenantConfigSync(tenantId) : null;

  const workspaceURL = `${getPortalRoot(
    getPublicEnvironment(config).GOOVEE_PUBLIC_HOST,
  )}${workspaceURI || ''}`;

  return {
    workspaceURI,
    tenantId,
    workspaceURL,
  };
}

export async function isExistingUser({
  workspaceURL,
  client,
  user: userProp,
}: {
  workspaceURL: string;
  client: Client;
  user?: {
    id: string;
    email: string;
    isContact: boolean;
    mainPartnerId?: string;
  } & any;
}) {
  const session = await getSession();
  const user = userProp || session?.user;

  if (user) {
    const userWorkspaces = await findWorkspaces({
      url: workspaceURL,
      user,
      client,
    }).then(clone);
    const existing = userWorkspaces.some(w => w.url === workspaceURL);

    return existing;
  }
}
