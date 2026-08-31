import {genericOAuth} from 'better-auth/plugins';
import type {GenericOAuthConfig} from 'better-auth/plugins';

import {listTenantConfigsSync} from '@/tenant/config-provider';

const GOOGLE_DISCOVERY_URL =
  'https://accounts.google.com/.well-known/openid-configuration';

export type OAuthRegistration = {
  provider: 'google' | 'keycloak';
  tenantId: string;
};

const registrations = new Map<string, OAuthRegistration>();

/* A generic provider sends a code challenge only when it is asked to, where a
 * built-in one always does. Carrying pkce in the type is what keeps the next
 * provider added here from being registered without one. */
type TenantOAuthConfig = GenericOAuthConfig & {pkce: true};

function buildConfigs(): TenantOAuthConfig[] {
  const configs: TenantOAuthConfig[] = [];

  /* One pass fills both the list returned here and the lookup it is paired
   * with, and the plugin keeps the list it is handed, so which providers are
   * served changes only when the whole auth instance is built again. Emptying
   * first is what keeps a second pass from leaving a lookup entry behind for a
   * provider it did not register. */
  registrations.clear();

  /* Tenants bring their own OAuth applications: each is registered under the
   * provider id <provider>-<tenantId>, and the matching redirect URI
   * (/api/auth/oauth2/callback/<provider>-<tenantId>) must be registered
   * with the identity provider. */
  for (const [tenantId, config] of listTenantConfigsSync()) {
    const oauth = config.oauth;
    if (!oauth) continue;

    if (oauth.google) {
      const providerId = `google-${tenantId}`;
      configs.push({
        providerId,
        discoveryUrl: GOOGLE_DISCOVERY_URL,
        clientId: oauth.google.clientId,
        clientSecret: oauth.google.clientSecret,
        scopes: ['openid', 'email', 'profile'],
        pkce: true,
        authorizationUrlParams: {prompt: 'select_account'},
      });
      registrations.set(providerId, {provider: 'google', tenantId});
    }

    if (oauth.keycloak) {
      const providerId = `keycloak-${tenantId}`;
      configs.push({
        providerId,
        discoveryUrl: `${oauth.keycloak.issuer}/.well-known/openid-configuration`,
        clientId: oauth.keycloak.clientId,
        clientSecret: oauth.keycloak.clientSecret,
        scopes: ['openid', 'email', 'profile'],
        pkce: true,
      });
      registrations.set(providerId, {provider: 'keycloak', tenantId});
    }
  }

  return configs;
}

const configs = buildConfigs();

/**
 * The tenant and the identity provider a callback belongs to, read from the
 * provider id the request arrived on.
 *
 * The provider id is what decides whose identity assertions are trusted: it
 * selected the client credentials, and for keycloak the issuer as well. So the
 * tenant a callback acts on is taken from here and never from anything the
 * caller sent along with it. The answer is recorded as each registration is
 * built, so it cannot disagree with what was registered, and a provider id
 * nobody registered has none — no callback can reach one.
 */
export function findOAuthRegistration(
  providerId?: string,
): OAuthRegistration | null {
  return (providerId ? registrations.get(providerId) : null) ?? null;
}

const oauthProviders = configs.length ? genericOAuth({config: configs}) : null;

export default oauthProviders;
