import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SEARCH_PARAMS} from '@/constants';
import {getSessionTenantId} from '@/lib/auth';
import {isReservedSegment} from '@/lib/core/path/reserved-segments';
import {
  addressedHost,
  hostRoutedTenantId,
  isDeclaredHost,
  isHostRouted,
} from '@/lib/core/tenant/routing';
import {
  getGlobalConfig,
  getTenantConfig,
  listTenantConfigs,
} from '@/tenant/config-provider';

export const TENANT_HEADER = 'x-tenant-id';
export const WORKSPACE_HEADER = 'x-workspace-id';
export const CURRENT_PATH_HEADER = 'x-current-path';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. /_vercel (platform endpoints, e.g. /_vercel/insights)
     * 5. all root files inside /public (e.g. /favicon.ico)
     * 6. all files inside /public/images website locales pwa and pdfjs
     * 7. the per-tenant web manifest (public, but fetched with same-origin
     *    cookies, so it must not run the session logic)
     *
     * `isReservedSegment` decides which names a tenant may not use. Add any
     * directory excluded here to it as well. This value cannot be generated
     * from that list: Next reads it from the source at build time and ignores
     * computed values.
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+|[\\w-]+/manifest\\.webmanifest|images/|website/|pwa/|locales/|pdfjs/).*)',
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
function notFound(req: NextRequest) {
  const url = req.nextUrl.clone();

  url.pathname = '/_not-found';
  url.search = '';

  return NextResponse.rewrite(url);
}

/* Sends a session that cannot reach an address to the sign-out screen of the
 * tenant it belongs to, carrying that address to return to.
 *
 * A redirect rather than a rewrite, because the screen has to be reached under
 * the tenant's own path: the document is bound to the service worker whose scope
 * covers the address it was created at, and only the worker of the tenant being
 * left holds the push subscription to revoke. Rendering the screen at the refused
 * address would leave that subscription in place.
 *
 * On the origin the request arrived at, always. That is the origin that just sent
 * the session cookie, so it is the only one where the screen can clear it, and
 * the only one whose worker holds the subscription — whatever origin the document
 * now declares for the tenant. A session made before the tenant was given an
 * origin of its own is the case that makes the difference: it sits on the origin
 * it was made on, and a screen placed on the new one would find nothing to end.
 *
 * 303, so a request that is not a GET arrives at the screen as one. */
function signOutFirst(
  req: NextRequest,
  {activeTenant}: {activeTenant: string},
) {
  const url = req.nextUrl.clone();
  const callbackurl = url.pathname + url.search;

  url.pathname = `/${activeTenant}/sign-out`;
  url.search = new URLSearchParams({callbackurl}).toString();

  return NextResponse.redirect(url, 303);
}

/* The tenant a sign-in screen is for, as the address names it: the parameter the
 * portal adds when it sends a visitor there, then the host, then the document's
 * default. The parameter is taken only when it names a configured tenant, so a
 * stale one does not hide the tenant whose origin the visitor is actually on. */
function intendedAuthTenant(
  req: NextRequest,
  hostTenant: string | null,
): string | null {
  const named =
    req.nextUrl.searchParams.get(SEARCH_PARAMS.TENANT_ID) ??
    req.nextUrl.searchParams.get('tenantId');

  if (named && getTenantConfig(named)) return named;

  return hostTenant ?? getGlobalConfig().defaultTenant ?? null;
}

/* Moves a sign-in screen onto the origin of the tenant it is for, where the
 * request did not arrive there.
 *
 * Signing in has to happen on that origin: the session cookie carries no domain,
 * so it is written for whichever host answered, and a visitor who authenticated
 * on another origin arrives at the tenant with no session at all. The redirect
 * target is the origin the document declares for the tenant, so nothing an
 * address carries decides where a visitor is sent.
 *
 * 307 rather than 308: which origin serves a tenant is configuration, and a
 * browser must not cache a move that the next deployment can reverse. */
function authOriginRedirect(req: NextRequest, hostTenant: string | null) {
  const intended = intendedAuthTenant(req, hostTenant);

  if (!intended) return null;

  const config = getTenantConfig(intended);

  if (!config) return null;

  const origin = new URL(config.publicEnv.GOOVEE_PUBLIC_HOST);

  if (origin.host === addressedHost(req.headers)) return null;

  const target = req.nextUrl.clone();

  target.protocol = origin.protocol;
  target.host = origin.host;

  /* The address to return to after signing in does not survive the move: it was
   * written for the addresses of the origin the request came from, so on this one
   * it names something else — a tenant segment there is a workspace name here.
   * Dropped rather than translated, because the screen sends a visitor to their
   * tenant's own landing address when it carries none. */
  target.searchParams.delete('callbackurl');
  target.searchParams.delete('workspaceURI');

  /* On its own origin the tenant is named by the host, and a parameter naming it
   * again is one more thing that can disagree. Everywhere else it is named
   * explicitly, including where this resolved it from the document's default. */
  if (isHostRouted(config)) {
    target.searchParams.delete(SEARCH_PARAMS.TENANT_ID);
    target.searchParams.delete('tenantId');
  } else {
    target.searchParams.set(SEARCH_PARAMS.TENANT_ID, intended);
  }

  return NextResponse.redirect(target, 307);
}

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const tenants = listTenantConfigs();

  /* The host is read only where the document gives it a meaning. A deployment
   * whose tenants are all reached under a path segment resolves them from the
   * path alone, exactly as one with no proxy in front does, so no request is
   * refused for the address it arrived at. */
  const routesByHost = tenants.some(([, config]) => isHostRouted(config));

  let hostTenant: string | null = null;

  if (routesByHost) {
    const host = addressedHost(req.headers);

    /* Refused rather than read as a path, because a host the document does not
     * name is one no tenant is served at: whether the deployment is reached
     * through a proxy that passes the address on is settled here, once, instead
     * of surfacing later as a workspace that cannot be found and a sign-in that
     * loops. Static files and route handlers are outside this matcher and answer
     * on any host, so a probe addressing the server directly still reaches them. */
    if (
      !host ||
      !isDeclaredHost(host, getGlobalConfig().betterAuthUrl, tenants)
    ) {
      return notFound(req);
    }

    hostTenant = hostRoutedTenantId(host, tenants);
  }

  /* The sign-in screens sit outside the tenant segment, so they are reached the
   * same way whichever shape a tenant's addresses take — but only on that
   * tenant's own origin. Checked before the reserved segments below pass them
   * through, since that is where they would otherwise be answered.
   *
   * Only where some tenant has an origin of its own. With every tenant under a
   * path segment there is no second origin to move a screen to, and comparing
   * the address a request arrived at against the one the document declares would
   * turn every alias of a working deployment into a redirect. */
  if (routesByHost && extractTenant(url.pathname)?.toLowerCase() === 'auth') {
    return authOriginRedirect(req, hostTenant) ?? NextResponse.next();
  }

  /* On a host-routed address the first segment names a workspace, so the
   * addresses the deployment answers itself are taken before the tenant segment
   * is put back on. `/sign-out` is not among them: it lives under the tenant
   * segment and is reached once that segment is restored. */
  if (hostTenant) {
    const first = extractTenant(url.pathname);

    if (first && isReservedSegment(first)) {
      return NextResponse.next();
    }
  }

  /* What the route tree is asked for. A host-routed address gains the tenant
   * segment it does not carry, so one route tree serves both shapes and every
   * page reads its tenant from `params` either way. */
  const pathname = hostTenant
    ? `/${hostTenant}${url.pathname === '/' ? '' : url.pathname}`
    : url.pathname;

  if (pathname === '/') {
    return NextResponse.next();
  }

  const tenant = hostTenant ?? extractTenant(pathname);

  if (!tenant) return notFound(req);

  /* The deployment answers these itself: the sign-in screens, the route
   * handlers, the static directories. The whole segment is compared, so a
   * tenant named `authcorp` is not mistaken for `auth`. The configuration
   * document refuses tenant ids from this same list. */
  if (isReservedSegment(tenant)) {
    return NextResponse.next();
  }

  /* A tenant routed by host has one address, and this is not it: reached under a
   * path segment on an origin it does not hold, its stored workspace URLs match
   * nothing and its session cookie belongs to the other origin. Sent to the
   * address it is served at rather than refused, so an address that predates the
   * move still arrives; 308 keeps the method, and this cannot bounce back,
   * because the tenant is resolved from the host there rather than the path. */
  const pathTenantConfig = hostTenant ? null : getTenantConfig(tenant);

  /* Its sign-out screen is the exception, and stays where it is asked for. A
   * session made before the tenant moved sits on this origin, and this is the
   * only address here that can end it — sent on to the new origin it would arrive
   * where that cookie is never sent, leaving no way to reach the screen at all. */
  const isSignOutScreen = pathname === `/${tenant}/sign-out`;

  if (pathTenantConfig && isHostRouted(pathTenantConfig) && !isSignOutScreen) {
    const canonical = url.clone();
    const origin = new URL(pathTenantConfig.publicEnv.GOOVEE_PUBLIC_HOST);

    canonical.protocol = origin.protocol;
    canonical.host = origin.host;
    canonical.pathname = url.pathname.slice(`/${tenant}`.length) || '/';

    return NextResponse.redirect(canonical, 308);
  }

  /* One tenant session per browser: a session belongs to a single tenant and
   * is never silently dropped. Reaching a different tenant is refused, and the
   * cookie left intact, so the visitor keeps their session and signs out
   * explicitly on the screen they are sent to instead.
   *
   * Only a tenant the document names gets that screen, since the screen sends
   * the visitor on to it. A name the document does not hold carries on to the
   * not-found a visitor with no session gets for it.
   *
   * Session cookies carry no domain, so two tenants served on origins of their
   * own hold their sessions in separate stores and cannot collide here. What
   * reaches this on a host-routed address is a session created against another
   * tenant on this origin — signing in for one tenant while addressing another.
   *
   * The screen names the session's tenant in the path, so only an origin no
   * tenant holds to itself can address it: on one that does, the host puts its
   * own tenant back in front and the name is read as a workspace. An origin held
   * by a tenant therefore refuses the request instead of sending it somewhere
   * that cannot serve it — except where the session names no tenant the document
   * holds, which resolves to no session at all, so the request carries on and is
   * answered as a guest. Signing in on that origin replaces the session either
   * way. */
  const activeTenant = await getSessionTenantId(req.headers);

  if (activeTenant && activeTenant !== tenant && getTenantConfig(tenant)) {
    if (!hostTenant) {
      return signOutFirst(req, {activeTenant});
    }

    if (getTenantConfig(activeTenant)) {
      return notFound(req);
    }
  }

  const headers = new Headers(req.headers);

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
