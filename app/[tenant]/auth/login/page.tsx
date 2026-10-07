import type {Metadata} from 'next';
import {redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {
  canSelfRegister,
  canSignIn,
  getSignInMethods,
} from '@/auth/sign-in-methods';
import {getPublicEnvironment} from '@/environment';
import {t} from '@/locale/server';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {canRegisterForWorkspace} from '@/orm/workspace';
import {manager} from '@/tenant';
import {getTenantConfig} from '@/tenant/config';
import {isSameOrigin} from '@/utils/same-origin';
import {absoluteRoot} from '@/url/absolute';
import {tenantURLs} from '@/url/scope';

import {resolveAuthTenantId} from '../common/tenant';
import {SignInUnavailable} from '../common/ui/sign-in-unavailable';
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

  /* Non-null: the tenant layout above refuses a segment naming no tenant. */
  const host = getPublicEnvironment(tenantConfig)!.host;

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

  /* Read from this tenant's own `auth` settings. OAuth is per-tenant: a tenant
   * offers a provider only when its own config declares it (registered as the
   * generic provider <provider>-<tenantId>). There is no global env-configured
   * app. */
  const signInMethods = getSignInMethods(tenantConfig);

  const workspaceName = await resolveAuthWorkspaceName(props.searchParams);

  if (!canSignIn(signInMethods)) {
    return (
      <SignInUnavailable
        title={await t('Log In')}
        description={await t('Sign-in is not available on this portal.')}
        workspaceName={workspaceName}
      />
    );
  }

  let canRegister;

  if (workspaceURL && canSelfRegister(signInMethods)) {
    const tenant = await manager.getTenant(tenantId);
    if (tenant) {
      canRegister = await canRegisterForWorkspace({
        url: workspaceURL,
        client: tenant.client,
      });
    }
  }

  return (
    <Content
      canRegister={canRegister}
      showPasswordSignIn={signInMethods.password}
      showGoogleOauth={signInMethods.google}
      showKeycloakOauth={signInMethods.keycloak}
      workspaceName={workspaceName}
      googleProviderId={signInMethods.google ? `google-${tenantId}` : undefined}
      keycloakProviderId={
        signInMethods.keycloak ? `keycloak-${tenantId}` : undefined
      }
    />
  );
}
