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

/* Sessions are stateless — the cookie pair IS the session — so a browser can
 * hold one session per tenant by parking each tenant's session cookies under
 * tenant-prefixed names while another tenant's are active. Switching tenants
 * is pure cookie shuffling of opaque values; no auth state lives anywhere
 * else. Once tenants run on their own domains, cookie jars separate
 * naturally and the parking never triggers.
 *
 * Parked names must NOT extend the auth cookie names: better-auth chunks
 * oversized cookies as "<name>.0", "<name>.1", … and deletes everything
 * prefixed "<name>." when it writes, which would wipe the parked copies. */
function parkedCookieName(tenant: string, name: string) {
  return `goovee-parked.${tenant}.${name}`;
}

/* The four cookies better-auth treats as one session unit — the same set
 * customSession clears when the partner is gone. hasParkedSession keys off
 * the first entry (the session token). */
async function getSessionCookieNames(): Promise<string[]> {
  const {authCookies} = await auth.$context;
  return [
    authCookies.sessionToken.name,
    authCookies.sessionData.name,
    authCookies.accountData.name,
    authCookies.dontRememberToken.name,
  ];
}

/* Raw parse so opaque values round-trip verbatim — NextRequest's cookie
 * parsing decodes values, and re-encoding could corrupt them. */
function parseRawCookies(req: NextRequest): Map<string, string> {
  const cookies = new Map<string, string>();
  const header = req.headers.get('cookie');
  if (!header) return cookies;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator > 0) {
      cookies.set(
        part.slice(0, separator).trim(),
        part.slice(separator + 1).trim(),
      );
    }
  }
  return cookies;
}

function serializeCookie(
  req: NextRequest,
  name: string,
  value: string,
  maxAgeSeconds: number,
) {
  const secure = req.nextUrl.protocol === 'https:' ? '; Secure' : '';
  return `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure}`;
}

const PARKED_SESSION_MAX_AGE = 7 * 24 * 60 * 60; // matches the session cookie cache

/**
 * Parks the active tenant's session cookies and restores the target tenant's
 * parked ones when present, then continues the request with the switched
 * cookies — the browser receives them via Set-Cookie, and this request sees
 * them through the patched cookie header.
 */
function switchTenantSession(
  req: NextRequest,
  requestHeaders: Headers,
  {
    cookieNames,
    activeTenant,
    targetTenant,
  }: {cookieNames: string[]; activeTenant?: string; targetTenant: string},
): NextResponse {
  const cookies = parseRawCookies(req);
  const setCookies: string[] = [];

  for (const name of cookieNames) {
    const activeValue = cookies.get(name);
    const parkedName = parkedCookieName(targetTenant, name);
    const parkedValue = cookies.get(parkedName);

    if (activeTenant && activeValue) {
      setCookies.push(
        serializeCookie(
          req,
          parkedCookieName(activeTenant, name),
          activeValue,
          PARKED_SESSION_MAX_AGE,
        ),
      );
    }

    if (parkedValue) {
      cookies.set(name, parkedValue);
      cookies.delete(parkedName);
      setCookies.push(
        serializeCookie(req, name, parkedValue, PARKED_SESSION_MAX_AGE),
        serializeCookie(req, parkedName, '', 0),
      );
    } else {
      cookies.delete(name);
      setCookies.push(serializeCookie(req, name, '', 0));
    }
  }

  requestHeaders.set(
    'cookie',
    [...cookies].map(([name, value]) => `${name}=${value}`).join('; '),
  );

  const response = NextResponse.next({request: {headers: requestHeaders}});
  for (const setCookie of setCookies) {
    response.headers.append('set-cookie', setCookie);
  }

  return response;
}

async function getActiveSessionTenant(
  req: NextRequest,
): Promise<string | undefined> {
  if (!getSessionCookie(req)) return undefined;

  /* Read the tenant id from the encrypted (JWE) session-data cookie instead
   * of auth.api.getSession(): getSession runs the customSession enrichment
   * query on every matched request — including every <Link> prefetch — while
   * the proxy only needs the tenant id, which is immutable for a session and
   * already in the cookie. `strategy` must match session.cookieCache.strategy
   * in lib/auth.ts. Fall back to getSession when the cache is absent, expired,
   * or undecodable. */
  try {
    const cached = await getCookieCache(req, {strategy: 'jwe'});
    const cachedTenantId: unknown = cached?.session.tenantId;
    if (typeof cachedTenantId === 'string') {
      return cachedTenantId;
    }
  } catch {
    // fall through to a full session lookup
  }

  const session = await auth.api.getSession({headers: req.headers});
  return session?.user.tenantId ?? undefined;
}

async function hasParkedSession(
  req: NextRequest,
  tenant: string,
): Promise<boolean> {
  const [sessionTokenName] = await getSessionCookieNames();
  return parseRawCookies(req).has(parkedCookieName(tenant, sessionTokenName));
}

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  if (pathname.startsWith('/auth') || pathname === '/') {
    /* Visiting an auth page for another tenant (login, register, invite)
     * parks the active tenant's session first, so the sign-in that follows
     * starts a fresh session instead of overwriting it. */
    if (isMultiTenancy) {
      const targetTenant = url.searchParams.get('tenant');
      if (targetTenant) {
        const activeTenant = await getActiveSessionTenant(req);
        const shouldSwitch = activeTenant
          ? activeTenant !== targetTenant
          : await hasParkedSession(req, targetTenant);
        if (shouldSwitch) {
          return switchTenantSession(req, new Headers(req.headers), {
            cookieNames: await getSessionCookieNames(),
            activeTenant,
            targetTenant,
          });
        }
      }
    }
    return NextResponse.next();
  }

  const tenant = extractTenant(pathname, getBasePath());

  const headers = new Headers(req.headers);

  if (tenant) {
    headers.set(TENANT_HEADER, tenant);
  }

  if (isMultiTenancy) {
    if (!tenant) return notFound(req);

    const activeTenant = await getActiveSessionTenant(req);
    const shouldSwitch = activeTenant
      ? activeTenant !== tenant
      : await hasParkedSession(req, tenant);
    if (shouldSwitch) {
      /* Continue with this tenant's restored session, or as a guest when it
       * has none — any other tenant's session stays parked either way. */
      return switchTenantSession(req, headers, {
        cookieNames: await getSessionCookieNames(),
        activeTenant,
        targetTenant: tenant,
      });
    }
  }

  return NextResponse.next({
    request: {
      headers,
    },
  });
}
