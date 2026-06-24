import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {Environment, getPublicEnvironment} from '@/environment';

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

  /* A session belongs to a single tenant. Bounce away from the login form only
   * when the active session already satisfies the request — no specific tenant
   * was asked for, or the session's tenant matches it; otherwise render the form. */
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

  /* OAuth is per-tenant: a tenant offers a provider only when its own config
   * declares it (registered as the generic provider <provider>-<tenantId>).
   * There is no global env-configured app. */
  const tenantOauth = tenantConfig?.oauth;

  const showGoogleOauth = Boolean(tenantOauth?.google);

  const showKeycloakOauth = Boolean(tenantOauth?.keycloak);

  /* Outside the [tenant] segment, so the tenant's browser variables (host,
   * Keycloak button label/image consumed by Content) come from here, keyed by
   * the ?tenant= param. No tenant ⇒ an empty set, by design (no fallback). */
  return (
    <Environment value={tenantConfig?.publicEnv ?? {}}>
      <Content
        canRegister={canRegister}
        showGoogleOauth={showGoogleOauth}
        showKeycloakOauth={showKeycloakOauth}
        googleProviderId={
          tenantOauth?.google ? `google-${tenantId}` : undefined
        }
        keycloakProviderId={
          tenantOauth?.keycloak ? `keycloak-${tenantId}` : undefined
        }
      />
    </Environment>
  );
}
