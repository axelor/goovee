import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {getSessionTenantId} from '@/lib/auth';
import {getBasePath} from '@/lib/core/path/base-path';

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
     * 4. all root files inside /public (e.g. /favicon.ico)
     * 5. all files inside /public/images website locales pwa and pdfjs
     * 6. the per-tenant web manifest (public, but fetched with same-origin
     *    cookies, so it must not run the session logic)
     *
     * Anything left out of this list is read as a tenant name, so a directory
     * of static files added under /public has to be named here too or it
     * resolves to a tenant that does not exist.
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+|[\\w-]+/manifest\\.webmanifest|images/|website/|pwa/|locales/|pdfjs/).*)',
  ],
};

export function extractTenant(url: string, basePath: string = '') {
  const normalizedBasePath = basePath.replace(/\/$/, '');

  if (normalizedBasePath && url.startsWith(normalizedBasePath)) {
    url = url.slice(normalizedBasePath.length);
  }

  url = url.startsWith('/') ? url : '/' + url;

  const pattern = /^\/([a-zA-Z]+)(?:\/.*)?$/;
  const matches = url.match(pattern);

  return matches ? matches[1] : null;
}

/* Renders the not-found page for a request the proxy refuses, keeping the address
 * the visitor asked for. `/_not-found` is where the framework serves that page
 * from; every single-segment address belongs to the tenant segment. */
function notFound(req: NextRequest, {message = ''}: {message?: string} = {}) {
  const searchParams = message ? `message=${encodeURIComponent(message)}` : '';

  return NextResponse.rewrite(
    new URL(`/_not-found${searchParams ? `?${searchParams}` : ''}`, req.url),
  );
}

const isMultiTenancy = process.env.MULTI_TENANCY === 'true';

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  if (pathname.startsWith('/auth') || pathname === '/') {
    return NextResponse.next();
  }

  const tenant = extractTenant(pathname, getBasePath());

  if (isMultiTenancy) {
    if (!tenant) return notFound(req);

    /* One tenant session per browser: a session belongs to a single tenant and
     * is never silently dropped. Reaching a different tenant is refused with a
     * prompt to log out first — the cookie is left intact, so the user keeps
     * their session and logs out explicitly before switching. */
    const activeTenant = await getSessionTenantId(req.headers);
    if (activeTenant && activeTenant !== tenant) {
      return notFound(req, {
        message:
          'You are already loggedin to a tenant. For accessing different tenant, you need to logout first.',
      });
    }
  }

  const headers = new Headers(req.headers);

  /* Record the path (with query string) being requested so server components
     can send a denied guest back to exactly where they were after login. */
  headers.set(CURRENT_PATH_HEADER, url.pathname + url.search);

  if (tenant) {
    headers.set(TENANT_HEADER, tenant);
  }

  return NextResponse.next({
    request: {
      headers,
    },
  });
}
