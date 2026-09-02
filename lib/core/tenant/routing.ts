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

/**
 * A host in the one spelling every comparison uses: lowercased, with a default
 * port left off.
 *
 * Both sides of every host lookup go through this — the index built from the
 * document below, and the address a request carries — so the two cannot
 * disagree on spelling. A Host header carries no scheme, so 80 and 443 are
 * both treated as default; the document refuses an origin that spells either
 * one out, which is what keeps this strip from ever separating two hosts the
 * document told apart.
 */
export function canonicalHost(host: string): string {
  return host.toLowerCase().replace(/:(80|443)$/, '');
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
 * Canonicalized, because a browser sends the host as the address was typed and
 * some proxies write the port into the header even when it is the scheme's own.
 * Without this, `Host: ACME.example.com` or `acme.example.com:443` matches no
 * declared host and the whole deployment answers not-found.
 *
 * Null where neither header carries a value, which a caller that needs a host
 * treats as one it does not serve. An empty `x-forwarded-host` falls through to
 * `Host` rather than standing in for it: a proxy that sets the header but leaves
 * it blank would otherwise take every address away from the deployment.
 */
export function addressedHost(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const addressed = forwarded || headers.get('host')?.trim();

  return addressed ? canonicalHost(addressed) : null;
}

/**
 * The questions the request path asks of the document's routing, answered as
 * the document is loaded.
 *
 * Every field is derived from values the document fixes at load, so a request
 * reads a `Map` or a `Set` instead of scanning the tenants and parsing each
 * one's origin again — and the four answers cannot drift apart, being built
 * together from one pass.
 *
 * The collections are readonly to the compiler only. A `Map` or a `Set` cannot
 * be frozen — its contents are internal slots rather than properties — so what
 * holds them fixed is that they are built here and handed out under this type:
 * writing to one takes a cast.
 */
export type RoutingIndex = {
  /**
   * Whether any tenant is routed by host, and so whether the address a request
   * arrived at carries a meaning. False for a deployment that resolves every
   * tenant from the path, which is reached on any host.
   */
  routesByHost: boolean;

  /**
   * The host-routed tenant served on a host. A host this does not hold names no
   * host-routed tenant, which covers the origin path-routed tenants share — a
   * caller reads the tenant from the path there.
   *
   * Keyed by `canonicalHost` spelling — host and optional port, no scheme —
   * which is what `addressedHost` hands a lookup.
   */
  tenantByHost: ReadonlyMap<string, string>;

  /**
   * Every host the deployment answers on. The set a request's host has to be
   * in: a host outside it resolves no tenant, so the proxy refuses the request
   * rather than reading a tenant from the path it carries.
   */
  declaredHosts: ReadonlySet<string>;

  /**
   * The same addresses as origins rather than hosts, deduplicated: the origin
   * addresses naming no tenant are served on, plus each tenant's own.
   *
   * What better-auth is given as the origins it may authenticate on. It needs
   * the same answer as `declaredHosts`, because authenticating on a host the
   * deployment does not know would build addresses nobody is served at.
   */
  declaredOrigins: readonly string[];
};

/**
 * Reads the document's routing into the form the request path uses.
 *
 * `deploymentOrigin` is `$global.betterAuthUrl`, the origin serving the
 * addresses that name no tenant.
 *
 * One host-routed tenant per host is a precondition, not an assumption this
 * makes: the document is refused at load where two claim the same host, so no
 * entry here can be overwritten by a later one. Called once per loaded
 * document, which is why parsing each origin is done in full here.
 */
export function buildRoutingIndex(
  deploymentOrigin: string,
  tenants: Array<[string, TenantConfig]>,
): RoutingIndex {
  const tenantByHost = new Map<string, string>();
  const declaredHosts = new Set<string>([
    canonicalHost(new URL(deploymentOrigin).host),
  ]);
  const origins = new Set<string>([deploymentOrigin]);

  let routesByHost = false;

  for (const [id, config] of tenants) {
    const origin = config.publicEnv.GOOVEE_PUBLIC_HOST;

    /* Parsed once, and both collections hold the same spelling because they
     * hold the same value. */
    const host = canonicalHost(new URL(origin).host);

    declaredHosts.add(host);
    origins.add(origin);

    if (isHostRouted(config)) {
      routesByHost = true;
      tenantByHost.set(host, id);
    }
  }

  return {
    routesByHost,
    tenantByHost,
    declaredHosts,
    declaredOrigins: [...origins],
  };
}
