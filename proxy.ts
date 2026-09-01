import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {getSessionTenantId} from '@/lib/auth';
import {isReservedSegment} from '@/lib/core/path/reserved-segments';
import {getTenantConfig} from '@/tenant/config-provider';

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
 * `/<tenant>/`: the document is bound to the service worker whose scope covers
 * the address it was created at, and only the worker of the tenant being left
 * holds the push subscription to revoke. Rendering the screen at the refused
 * address would leave that subscription in place.
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

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  if (pathname === '/') {
    return NextResponse.next();
  }

  const tenant = extractTenant(pathname);

  if (!tenant) return notFound(req);

  /* The deployment answers these itself: the sign-in screens, the route
   * handlers, the static directories. The whole segment is compared, so a
   * tenant named `authcorp` is not mistaken for `auth`. The configuration
   * document refuses tenant ids from this same list. */
  if (isReservedSegment(tenant)) {
    return NextResponse.next();
  }

  /* One tenant session per browser: a session belongs to a single tenant and
   * is never silently dropped. Reaching a different tenant is refused, and the
   * cookie left intact, so the visitor keeps their session and signs out
   * explicitly on the screen they are sent to instead.
   *
   * Only a tenant the document names gets that screen, since the screen sends
   * the visitor on to it. A name the document does not hold carries on to the
   * not-found a visitor with no session gets for it. */
  const activeTenant = await getSessionTenantId(req.headers);
  if (activeTenant && activeTenant !== tenant && getTenantConfig(tenant)) {
    return signOutFirst(req, {activeTenant});
  }

  const headers = new Headers(req.headers);

  /* Record the path (with query string) being requested so server components
     can send a denied guest back to exactly where they were after login. */
  headers.set(CURRENT_PATH_HEADER, url.pathname + url.search);

  headers.set(TENANT_HEADER, tenant);

  return NextResponse.next({
    request: {
      headers,
    },
  });
}
