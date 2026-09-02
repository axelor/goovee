import type {Metadata} from 'next';
import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {Environment, getPublicEnvironment} from '@/environment';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {canRegisterForWorkspace} from '@/orm/workspace';
import {SEARCH_PARAMS} from '@/constants';
import {manager} from '@/tenant';
import {getTenantConfig, listTenantIds} from '@/tenant/config';
import {isSameOrigin} from '@/utils/url';
import {withBasePath} from '@/lib/core/path/base-path';

import {resolveAuthTenantId} from '../common/tenant';
import {
  generateAuthMetadata,
  resolveAuthWorkspaceName,
} from '../common/workspace';

export async function generateMetadata(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  return generateAuthMetadata(props.searchParams);
}

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

  const tenantId = await resolveAuthTenantId(searchParams);

  const tenantConfig = tenantId ? getTenantConfig(tenantId) : null;

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
    const knownTenantIds = listTenantIds();
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
    <Environment value={getPublicEnvironment(tenantConfig)}>
      <Content
        tenantId={tenantId}
        canRegister={canRegister}
        showGoogleOauth={showGoogleOauth}
        showKeycloakOauth={showKeycloakOauth}
        workspaceName={await resolveAuthWorkspaceName(props.searchParams)}
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
