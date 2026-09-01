import type {TenantConfig} from './types';

/**
 * How a tenant's addresses are shaped.
 *
 * `path` — the tenant id is the first path segment, and the origin may be shared
 * with other tenants (`https://portal.example.com/acme/sales`).
 *
 * `host` — the origin names the tenant and the addresses carry no tenant segment
 * (`https://acme.example.com/sales`). The proxy puts the segment back on before
 * the request reaches a route, so the route tree is the same either way.
 */
export type TenantRouting = 'path' | 'host';

/*
 * Nothing here reads the configuration document: every function takes the
 * entries it works from, and the one import above is erased with the types. The
 * document's loader reads the environment as it is evaluated, so a module that
 * imports it for its value cannot itself be imported before the environment is
 * settled — which `pnpm config:check` relies on, having to name the document
 * before the loader is reached.
 */

/** `path` for a tenant that declares nothing, which is the shape without a proxy. */
export function tenantRouting(config: TenantConfig): TenantRouting {
  return config.routing ?? 'path';
}

export function isHostRouted(config: TenantConfig): boolean {
  return tenantRouting(config) === 'host';
}

/** Host and port of the origin a tenant is served on, as a Host header carries it. */
function configuredHost(config: TenantConfig): string {
  return new URL(config.publicEnv.GOOVEE_PUBLIC_HOST).host;
}

/**
 * The host a request was addressed to: host and optional port, no scheme.
 *
 * `x-forwarded-host` first, because a proxy that rewrites `Host` to the address
 * of the server behind it leaves that header as the only record of the address
 * the visitor used. Next fills it in from `Host` where it is absent, so the
 * fallback covers only a request that arrived with no proxy in front. A chain of
 * proxies appends to the header, and the address the visitor used is the first
 * entry.
 *
 * Lowercased, because a host name is case-insensitive and a browser sends it as
 * the address was typed, while every configured origin is held in the canonical
 * spelling `new URL` produces. Without this, `Host: ACME.example.com` matches no
 * tenant and is answered as an address the deployment does not serve.
 *
 * Null where neither header carries a value, which a caller that needs a host
 * treats as one it does not serve. An empty `x-forwarded-host` falls through to
 * `Host` rather than standing in for it: a proxy that sets the header but leaves
 * it blank would otherwise take every address away from the deployment.
 */
export function addressedHost(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const addressed = forwarded || headers.get('host')?.trim();

  return addressed?.toLowerCase() || null;
}

/**
 * The tenant a request arriving on `host` belongs to, or null where the host
 * names no host-routed tenant — which covers the origin path-routed tenants
 * share, so a caller reads the tenant from the path there.
 *
 * `host` is a Host header value: host and optional port, no scheme. The document
 * is checked at load, so at most one tenant claims a host.
 */
export function hostRoutedTenantId(
  host: string,
  tenants: Array<[string, TenantConfig]>,
): string | null {
  for (const [id, config] of tenants) {
    if (isHostRouted(config) && configuredHost(config) === host) {
      return id;
    }
  }

  return null;
}

/**
 * Whether `host` is an origin `tenant` holds to itself.
 *
 * Not the same question as whether the tenant is routed by host, and it is this
 * one that a service worker's scope and an installed app's entry turn on. A tenant
 * given an origin of its own is still reached under its path segment on the origin
 * it used to share — that is where the screen ending a session made before the
 * move is served — and its addresses there begin with the segment rather than at
 * the root.
 */
export function ownsAddressedHost(
  tenant: string,
  host: string | null,
  tenants: Array<[string, TenantConfig]>,
): boolean {
  return Boolean(host && hostRoutedTenantId(host, tenants) === tenant);
}

/**
 * Every origin this deployment answers on: the one addresses naming no tenant
 * are served on, plus each tenant's own.
 *
 * This is the set a request's host has to be in. It is what better-auth is given
 * as the origins it may authenticate on, and what the proxy refuses a request
 * outside of; both need the same answer, because a host the deployment does not
 * know resolves no tenant, and authenticating on it would build addresses nobody
 * is served at.
 */
export function declaredOrigins(
  deploymentOrigin: string,
  tenants: Array<[string, TenantConfig]>,
): string[] {
  const declared = tenants.map(
    ([, config]) => config.publicEnv.GOOVEE_PUBLIC_HOST,
  );

  return [...new Set([deploymentOrigin, ...declared])];
}

/** Whether the deployment is served on `host`, a Host header value. */
export function isDeclaredHost(
  host: string,
  deploymentOrigin: string,
  tenants: Array<[string, TenantConfig]>,
): boolean {
  return declaredOrigins(deploymentOrigin, tenants).some(
    origin => new URL(origin).host === host,
  );
}
