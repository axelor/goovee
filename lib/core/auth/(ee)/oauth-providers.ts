import {genericOAuth} from 'better-auth/plugins';
import type {GenericOAuthConfig} from 'better-auth/plugins';

import {getTenantConfig} from '@/tenant/config';

const GOOGLE_DISCOVERY_URL =
  'https://accounts.google.com/.well-known/openid-configuration';

export type OAuthRegistration = {
  provider: 'google' | 'keycloak';
  tenantId: string;
};

/*
 * Every provider any tenant has registered, keyed by provider id.
 *
 * One map across tenants, because the ids carry the tenant and so cannot
 * collide, and because each tenant's entries are written once — when its own
 * auth instance is first built — and never rewritten. Nothing clears it: a
 * tenant addressed later would otherwise wipe the entries of one addressed
 * earlier, leaving that tenant's callbacks resolving no registration.
 *
 * Held on `globalThis` for the reason the instance cache is: a module is
 * evaluated once per bundler layer and again on every recompile, and the
 * instances that filled this survive that. A fresh map beside surviving
 * instances would answer every callback with no registration at all.
 */
declare global {
  var __oauthRegistrations: Map<string, OAuthRegistration> | undefined;
}

const registrations = (global.__oauthRegistrations ??= new Map<
  string,
  OAuthRegistration
>());

/* A generic provider sends a code challenge only when it is asked to, where a
 * built-in one always does. Carrying pkce in the type is what keeps the next
 * provider added here from being registered without one. */
type TenantOAuthConfig = GenericOAuthConfig & {pkce: true};

function buildConfigs(tenantId: string): TenantOAuthConfig[] {
  const oauth = getTenantConfig(tenantId)?.oauth;

  if (!oauth) return [];

  const configs: TenantOAuthConfig[] = [];

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

  return configs;
}

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

/**
 * The OAuth providers one tenant offers, or null where it offers none.
 *
 * A tenant's own and nothing else. An instance carrying every tenant's
 * providers would answer a callback naming another tenant's provider id, and
 * the identity it vouched for would be created in that other tenant while the
 * session cookie was written for this one. Registering only this tenant's
 * leaves such a callback resolving no provider at all.
 *
 * Tenants bring their own OAuth applications: each provider is registered under
 * the id `<provider>-<tenantId>`, and the matching redirect URI —
 * `/<tenantId>/api/auth/oauth2/callback/<provider>-<tenantId>`, without the
 * tenant segment where the tenant holds an origin of its own — must be
 * registered with the identity provider.
 */
export function buildOAuthProviders(tenantId: string) {
  const configs = buildConfigs(tenantId);

  return configs.length ? genericOAuth({config: configs}) : null;
}
