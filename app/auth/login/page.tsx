import {redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findWorkspaces} from '@/orm/workspace';
import {
  ALLOW_ALL_REGISTRATION,
  ALLOW_AOS_ONLY_REGISTRATION,
  DEFAULT_TENANT,
  SEARCH_PARAMS,
} from '@/constants';
import {TenancyType, manager} from '@/tenant';

export default async function Page(
  props: {
    searchParams: Promise<{[key: string]: string}>;
  }
) {
  const searchParams = await props.searchParams;
  const session = await getSession();

  const workspaceURISearchParam = searchParams?.workspaceURI;
  const callbackurlSearchParam = searchParams?.callbackurl;

  const workspaceURI = workspaceURISearchParam
    ? decodeURIComponent(workspaceURISearchParam)
    : '';

  const callbackurl = callbackurlSearchParam
    ? decodeURIComponent(callbackurlSearchParam)
    : '';

  const tenantIdSearchParam = searchParams?.[SEARCH_PARAMS.TENANT_ID];

  let tenantId = tenantIdSearchParam
    ? decodeURIComponent(tenantIdSearchParam)
    : '';

  if (!tenantId && manager.getType() === TenancyType.single) {
    tenantId = DEFAULT_TENANT;
  }

  if (session?.user) {
    redirect(callbackurl || workspaceURI || '/');
  }

  const workspaceURL = workspaceURI
    ? `${process.env.GOOVEE_PUBLIC_HOST}${workspaceURI}`
    : '';

  let canRegister;

  if (workspaceURL) {
    const workspaces = await findWorkspaces({url: workspaceURL, tenantId});
    const workspace = workspaces.find((w: any) => w.url === workspaceURL);
    canRegister = [
      ALLOW_ALL_REGISTRATION,
      ALLOW_AOS_ONLY_REGISTRATION,
    ].includes(workspace?.allowRegistrationSelect);
  }

  const showGoogleOauth = process.env.SHOW_GOOGLE_OAUTH === 'true';

  const showKeycloakOauth = process.env.SHOW_KEYCLOAK_OAUTH === 'true';

  return (
    <Content
      canRegister={canRegister}
      showGoogleOauth={showGoogleOauth}
      showKeycloakOauth={showKeycloakOauth}
    />
  );
}
