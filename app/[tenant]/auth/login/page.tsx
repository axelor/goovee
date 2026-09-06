import type {Metadata} from 'next';
import {redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {getPublicEnvironment} from '@/environment';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {canRegisterForWorkspace} from '@/orm/workspace';
import {manager} from '@/tenant';
import {getTenantConfig} from '@/tenant/config';
import {isSameOrigin} from '@/utils/same-origin';
import {absoluteRoot} from '@/lib/core/url/absolute';
import {tenantURLs} from '@/lib/core/url/scope';

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

  const tenantId = await resolveAuthTenantId();

  const tenantConfig = getTenantConfig(tenantId);

  const host = getPublicEnvironment(tenantConfig).GOOVEE_PUBLIC_HOST!;

  /* A session here is always this tenant's — `getSession` resolves it through the
   * instance the address names — so any session at all means the visitor is
   * already signed in where they are asking to sign in, and the form has nothing
   * to offer them. */
  if (session?.user) {
    redirect(
      (callbackurl && isSameOrigin(callbackurl, host) && callbackurl) ||
        (workspaceURI && isSameOrigin(workspaceURI, host) && workspaceURI) ||
        /* This tenant's own entry, not the deployment's: on a shared origin the
         * deployment's resolves a tenant of its own and would land a visitor
         * signed in here on somebody else's. */
        tenantURLs(tenantId).forRouter('/'),
    );
  }

  const workspaceURL = workspaceURI
    ? `${absoluteRoot(host)}${workspaceURI}`
    : '';

  let canRegister;

  if (workspaceURL) {
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

  return (
    <Content
      canRegister={canRegister}
      showGoogleOauth={showGoogleOauth}
      showKeycloakOauth={showKeycloakOauth}
      workspaceName={await resolveAuthWorkspaceName(props.searchParams)}
      googleProviderId={tenantOauth?.google ? `google-${tenantId}` : undefined}
      keycloakProviderId={
        tenantOauth?.keycloak ? `keycloak-${tenantId}` : undefined
      }
    />
  );
}
