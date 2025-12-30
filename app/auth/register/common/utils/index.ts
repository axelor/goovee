import {getSession} from '@/auth';
import {getGooveeEnvironment} from '@/environment';
import {findWorkspaces} from '@/orm/workspace';
import {clone} from '@/utils';

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

  const workspaceURL = `${getGooveeEnvironment().GOOVEE_PUBLIC_HOST}${workspaceURI}`;

  return {
    workspaceURI,
    tenantId,
    workspaceURL,
  };
}

export async function isExistingUser({
  workspaceURL,
  tenantId,
  user: userProp,
}: {
  workspaceURL: string;
  tenantId: string;
  user?: {
    id: string;
    email: string;
    isContact: boolean;
    mainPartnerId?: string;
  } & any;
}) {
  const session = await getSession();
  const user = userProp || session?.user;

  let userWorkspaces = [];
  if (user) {
    userWorkspaces = await findWorkspaces({
      url: workspaceURL,
      user,
      tenantId,
    }).then(clone);
  }

  const existing = userWorkspaces.some((w: any) => w.url === workspaceURL);

  return existing;
}
