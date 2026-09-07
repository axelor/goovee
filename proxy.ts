import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {
  isDeploymentSegment,
  isReservedSegment,
} from '@/lib/core/path/reserved-segments';
import {addressedHost, isHostRouted} from '@/lib/core/tenant/routing';
import {getRoutingIndex, getTenantConfig} from '@/tenant/config';

export const TENANT_HEADER = 'x-tenant-id';
export const CURRENT_PATH_HEADER = 'x-current-path';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /_next (Next.js internals)
     * 2. /_static (inside /public)
     * 3. /_vercel (platform endpoints, e.g. /_vercel/insights)
     * 4. all root files inside /public (e.g. /favicon.ico)
     * 5. all files inside /public/images website locales pwa and pdfjs
     * 6. the per-tenant web manifest (public, but fetched with same-origin
     *    cookies, so it must not run the session logic)
     *
     * Route handlers are matched like anything else. A tenant's own are
     * addressed the way its pages are — with the tenant segment where the
     * tenant shares an origin, without it where the tenant holds one — so they
     * need the same segment put back on, and they carry the tenant header for
     * free. The deployment's own answer under `/deployment`, which
     * `isDeploymentSegment` passes through.
     *
     * `isReservedSegment` decides which names a tenant may not use. Add any
     * directory excluded here to it as well. This value cannot be generated
     * from that list: Next reads it from the source at build time and ignores
     * computed values.
     */
    '/((?!_next/|_static/|_vercel|[\\w-]+\\.\\w+|[\\w-]+/manifest\\.webmanifest|images/|website/|pwa/|locales/|pdfjs/).*)',
  ],
};

/* The path given here already has the base path removed. next.config.mjs sets
 * `basePath` from the same variable, and Next strips it before `pathname` can be
 * read. Stripping it again would cut those characters off the tenant name. */
export function extractTenant(url: string) {
  url = url.startsWith('/') ? url : '/' + url;

  const pattern = /^\/([a-zA-Z][a-zA-Z0-9-]*)(?:\/.*)?$/;
  const matches = url.match(pattern);

  return matches ? matches[1] : null;
}

/* Renders the not-found page for a request the proxy refuses, keeping the address
 * the visitor asked for. `/_not-found` is where the framework serves that page
 * from; every single-segment address belongs to the tenant segment. */
function notFound(req: NextRequest, headers: Headers) {
  const url = req.nextUrl.clone();

  url.pathname = '/_not-found';
  url.search = '';

  return NextResponse.rewrite(url, {request: {headers}});
}

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;

  /* Both headers below carry the proxy's own reading of the address, and every
   * answer this function gives is built on this copy so a client cannot send
   * either one itself. Taking them off matters most where the request is passed
   * straight through — the entry page and the deployment's own routes name no
   * tenant, so nothing further down would overwrite a forged value, and a
   * request could be answered under one tenant while its session belongs to
   * another. The addresses the matcher above excludes never reach this
   * function; none of them reads either header. */
  const headers = new Headers(req.headers);

  headers.delete(TENANT_HEADER);
  headers.delete(CURRENT_PATH_HEADER);

  const passThrough = () => NextResponse.next({request: {headers}});

  /* The deployment answers these itself: its own route handlers and the static
   * directories. Taken before the host is read, because they belong to no
   * tenant, so the host an address of theirs arrived on carries no meaning —
   * and a liveness probe reaching the server directly addresses it by an
   * address no tenant declares. Taken before the tenant segment is put back on
   * as well, since on a host-routed address the first segment names a
   * workspace. The whole segment is compared, so a tenant named `websitecorp`
   * is not mistaken for `website`. */
  const firstSegment = extractTenant(url.pathname);

  if (firstSegment && isDeploymentSegment(firstSegment)) {
    return passThrough();
  }

  /* The host is read only where the document gives it a meaning. A deployment
   * whose tenants are all reached under a path segment resolves them from the
   * path alone, exactly as one with no proxy in front does, so no request is
   * refused for the address it arrived at. */
  const {routesByHost, tenantByHost, declaredHosts} = getRoutingIndex();

  let hostTenant: string | null = null;

  if (routesByHost) {
    const host = addressedHost(req.headers);

    /* Refused rather than read as a path, because a host the document does not
     * name is one no tenant is served at: whether the deployment is reached
     * through a proxy that passes the address on is settled here, once, instead
     * of surfacing later as a workspace that cannot be found and a sign-in that
     * loops. What the deployment answers for itself is already past this, along
     * with the static files outside the matcher, so a probe addressing the
     * server directly still reaches them. */
    if (!host || !declaredHosts.has(host)) {
      return notFound(req, headers);
    }

    hostTenant = tenantByHost.get(host) ?? null;
  }

  /* What the route tree is asked for. A host-routed address gains the tenant
   * segment it does not carry, so one route tree serves both shapes and every
   * page reads its tenant from `params` either way. */
  const pathname = hostTenant
    ? `/${hostTenant}${url.pathname === '/' ? '' : url.pathname}`
    : url.pathname;

  if (pathname === '/') {
    return passThrough();
  }

  const tenant = hostTenant ?? firstSegment;

  if (!tenant) return notFound(req, headers);

  /* A name the document refuses as a tenant id, reached where a tenant should
   * be. `/api/…` on an origin no tenant holds is the case that arises: a
   * tenant's handlers are addressed under its own segment, so this names none.
   * Refused here rather than carried on, which would resolve it as a tenant
   * that cannot exist and render the not-found page for a workspace beneath
   * it. */
  if (isReservedSegment(tenant)) {
    return notFound(req, headers);
  }

  /* A tenant routed by host has one address, and this is not it: reached under a
   * path segment on an origin it does not hold, its stored workspace URLs match
   * nothing and its session cookie belongs to the other origin. Sent to the
   * address it is served at rather than refused, so an address that predates the
   * move still arrives; this cannot bounce back, because the tenant is resolved
   * from the host there rather than the path.
   *
   * 307 rather than 308, and it preserves the method either way. Which origin
   * serves a tenant is configuration, and a browser must not cache a move the
   * next deployment can reverse: a cached permanent redirect here would
   * outlive the routing that produced it: a tenant set back to `routing:
   * "path"` would keep receiving nothing, its path addresses answered from the
   * browser's own cache with the deployment never consulted. */
  const pathTenantConfig = hostTenant ? null : getTenantConfig(tenant);

  if (pathTenantConfig && isHostRouted(pathTenantConfig)) {
    const canonical = url.clone();
    const origin = new URL(pathTenantConfig.public.host);

    canonical.protocol = origin.protocol;
    canonical.host = origin.host;
    canonical.pathname = url.pathname.slice(`/${tenant}`.length) || '/';

    return NextResponse.redirect(canonical, 307);
  }

  /* Record the path (with query string) being requested so server components
     can send a denied guest back to exactly where they were after login. The
     address the visitor used, not the one the route tree is asked for, so what
     they are returned to is an address they can reach. */
  headers.set(CURRENT_PATH_HEADER, url.pathname + url.search);

  headers.set(TENANT_HEADER, tenant);

  /* A host-routed address is rewritten, so the tenant segment reaches the route
   * tree while the visitor's address bar keeps the address they asked for. The
   * two do not have to agree: a dynamic segment's value is read from the tree the
   * server resolved rather than from the address, so `useParams().tenant` holds
   * the tenant on a page whose `usePathname()` never names one. */
  if (hostTenant) {
    const rewritten = url.clone();
    rewritten.pathname = pathname;

    return NextResponse.rewrite(rewritten, {request: {headers}});
  }

  return NextResponse.next({
    request: {
      headers,
    },
  });
}
