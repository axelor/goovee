import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {getPublicEnvironment} from '@/environment';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {canRegisterForWorkspace} from '@/orm/workspace';
import {DEFAULT_TENANT, SEARCH_PARAMS} from '@/constants';
import {TenancyType, manager} from '@/tenant';
import {tenantConfigProvider} from '@/tenant/config-provider';
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

  const tenantConfig = tenantId
    ? await tenantConfigProvider.get(tenantId)
    : null;

  const host = getPublicEnvironment(tenantConfig).GOOVEE_PUBLIC_HOST!;

  /* With multiSession a browser can hold sessions for several tenants, so
   * only bounce when the active session already belongs to the requested
   * tenant — otherwise render the form to add a session for it. */
  const sessionMatchesTenant =
    session?.user && (!tenantId || session.user.tenantId === tenantId);

  if (sessionMatchesTenant) {
    redirect(
      (callbackurl && isSameOrigin(callbackurl, host) && callbackurl) ||
        (workspaceURI && isSameOrigin(workspaceURI, host) && workspaceURI) ||
        '/',
    );
  }

  const workspaceURL = workspaceURI
    ? `${host}${withBasePath(workspaceURI)}`
    : '';

  let canRegister;

  if (workspaceURL && tenantId) {
    const knownTenantIds = await manager.listTenantIds();
    if (!knownTenantIds.includes(tenantId)) {
      return notFound();
    }
    const tenant = await manager.getTenant(tenantId);
    if (tenant) {
      canRegister = await canRegisterForWorkspace({
        url: workspaceURL,
        client: tenant.client,
      });
    }
  }

  /* A tenant with its own OAuth application signs in through the generic
   * provider registered under <provider>-<tenantId>; otherwise the global
   * env-configured provider is offered. */
  const tenantOauth = tenantConfig?.oauth;

  const showGoogleOauth =
    Boolean(tenantOauth?.google) || process.env.SHOW_GOOGLE_OAUTH === 'true';

  const showKeycloakOauth =
    Boolean(tenantOauth?.keycloak) ||
    process.env.SHOW_KEYCLOAK_OAUTH === 'true';

  return (
    <Content
      canRegister={canRegister}
      showGoogleOauth={showGoogleOauth}
      showKeycloakOauth={showKeycloakOauth}
      googleProviderId={tenantOauth?.google ? `google-${tenantId}` : undefined}
      keycloakProviderId={
        tenantOauth?.keycloak ? `keycloak-${tenantId}` : undefined
      }
    />
  );
}
