import {genericOAuth} from 'better-auth/plugins';
import type {GenericOAuthConfig} from 'better-auth/plugins';

import {listTenantConfigsSync} from '@/tenant/config-provider';

const GOOGLE_DISCOVERY_URL =
  'https://accounts.google.com/.well-known/openid-configuration';

function buildConfigs(): GenericOAuthConfig[] {
  const configs: GenericOAuthConfig[] = [];

  /* Tenants bring their own OAuth applications: each is registered under the
   * provider id <provider>-<tenantId>, and the matching redirect URI
   * (/api/auth/oauth2/callback/<provider>-<tenantId>) must be registered
   * with the identity provider. */
  for (const [tenantId, config] of listTenantConfigsSync()) {
    const oauth = config.oauth;
    if (!oauth) continue;

    if (oauth.google) {
      configs.push({
        providerId: `google-${tenantId}`,
        discoveryUrl: GOOGLE_DISCOVERY_URL,
        clientId: oauth.google.clientId,
        clientSecret: oauth.google.clientSecret,
        scopes: ['openid', 'email', 'profile'],
        authorizationUrlParams: {prompt: 'select_account'},
      });
    }

    if (oauth.keycloak) {
      configs.push({
        providerId: `keycloak-${tenantId}`,
        discoveryUrl: `${oauth.keycloak.issuer}/.well-known/openid-configuration`,
        clientId: oauth.keycloak.clientId,
        clientSecret: oauth.keycloak.clientSecret,
        scopes: ['openid', 'email', 'profile'],
      });
    }
  }

  return configs;
}

const configs = buildConfigs();

const oauthProviders = configs.length ? genericOAuth({config: configs}) : null;

export default oauthProviders;
