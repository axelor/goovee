import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {auth} from '@/lib/auth';
import {getCookieCache, getSessionCookie} from 'better-auth/cookies';
import {getBasePath} from '@/lib/core/path/base-path';

export const TENANT_HEADER = 'x-tenant-id';
export const WORKSPACE_HEADER = 'x-workspace-id';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     * 5. all files inside /public/images website locales and pwa
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+|images/|website/|pwa/|locales/).*)',
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

function notFound(req: NextRequest, {message = ''}: {message?: string} = {}) {
  const searchParams = message ? `message=${encodeURIComponent(message)}` : '';

  return NextResponse.rewrite(
    new URL(`/not-found${searchParams ? `?${searchParams}` : ''}`, req.url),
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
    const sessionCookie = getSessionCookie(req);
    if (sessionCookie) {
      /* Read the tenant id straight from the encrypted (JWE) session-data cookie
       * instead of auth.api.getSession(). getSession runs the customSession
       * enrichment query on every matched request — including every <Link>
       * prefetch — while the proxy only needs the tenant id, which is immutable
       * for a session and already present in the cookie. Fall back to a full
       * getSession when the cookie cache is absent, expired, or undecodable. */
      let sessionTenantId: string | null = null;

      try {
        /* `strategy` must match session.cookieCache.strategy in lib/auth.ts;
         * the secret, cookie name and `__Secure-` prefix are resolved by Better
         * Auth from the env and request. */
        const cached = await getCookieCache(req, {strategy: 'jwe'});
        const cachedTenantId: unknown = cached?.session.tenantId;
        if (typeof cachedTenantId === 'string') {
          sessionTenantId = cachedTenantId;
        }
      } catch {
        sessionTenantId = null;
      }

      if (!sessionTenantId) {
        const session = await auth.api.getSession({headers: req.headers});
        sessionTenantId = session?.user.tenantId ?? null;
      }

      if (sessionTenantId && sessionTenantId !== tenant)
        return notFound(req, {
          message:
            'You are already loggedin to a tenant. For accessing different tenant, you need to logout first.',
        });
    }
  }

  const headers = new Headers(req.headers);

  if (tenant) {
    headers.set(TENANT_HEADER, tenant);
  }

  return NextResponse.next({
    request: {
      headers,
    },
  });
}
