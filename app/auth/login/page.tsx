import {redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {canRegisterForWorkspace} from '@/orm/workspace';
import {DEFAULT_TENANT, SEARCH_PARAMS} from '@/constants';
import {TenancyType, manager} from '@/tenant';
import {isSameOrigin} from '@/utils/url';
import {withBasePath} from '@/lib/core/path/base-path';

export default async function Page(props: {
  searchParams: Promise<{[key: string]: string}>;
}) {
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
    const host = process.env.GOOVEE_PUBLIC_HOST!;
    redirect(
      (callbackurl && isSameOrigin(callbackurl, host) && callbackurl) ||
        (workspaceURI && isSameOrigin(workspaceURI, host) && workspaceURI) ||
        '/',
    );
  }

  const workspaceURL = workspaceURI
    ? `${process.env.GOOVEE_PUBLIC_HOST}${withBasePath(workspaceURI)}`
    : '';

  let canRegister;

  if (workspaceURL && tenantId) {
    const tenant = await manager.getTenant(tenantId);
    if (tenant) {
      canRegister = await canRegisterForWorkspace({
        url: workspaceURL,
        client: tenant.client,
      });
    }
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
