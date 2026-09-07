import {NextResponse} from 'next/server';
import {toNextJsHandler} from 'better-auth/next-js';

// ---- CORE IMPORTS ---- //
import {getAuth} from '@/lib/auth';
import {withBasePath} from '@/lib/core/path/base-path';
import {addressedHost} from '@/lib/core/tenant/routing';
import {getTenantConfig} from '@/tenant/config';

type AuthHandler = (request: Request) => Promise<Response>;

/* The tenant comes from the address, which is the point of this route living
 * under the tenant segment: the instance that answers is the one mounted for
 * the tenant the request was sent to, so nothing in the body can name a
 * different one. */
type RouteContext = {params: Promise<{tenant: string}>};

/* Next strips the base path before a route sees the request, and better-auth
 * builds its own addresses from the pathname it is handed — so the prefix is
 * put back before the handler reads it. A deployment with no base path leaves
 * the pathname untouched and falls through unchanged. */
const withRestoredBasePath =
  (handler: AuthHandler): AuthHandler =>
  request => {
    const url = new URL(request.url);
    const pathname = withBasePath(url.pathname);

    if (pathname !== url.pathname) {
      url.pathname = pathname;
      return handler(new Request(url.toString(), request));
    }

    return handler(request);
  };

/* better-auth reads the origin it answers on from `x-forwarded-host` itself,
 * and it refuses a value its own host pattern does not match — a chain of
 * proxies appends entries, and the comma-joined result falls back to the
 * rewritten `Host` header, an origin no tenant is served at. The header is
 * therefore reduced to the one host the rest of the deployment resolves
 * (`addressedHost`), so routing and authentication cannot read the same
 * request as two different origins. */
const withAddressedHost =
  (handler: AuthHandler): AuthHandler =>
  request => {
    const host = addressedHost(request.headers);
    const forwarded = request.headers.get('x-forwarded-host');

    if (!host || !forwarded || forwarded === host) return handler(request);

    const normalized = new Request(request);
    normalized.headers.set('x-forwarded-host', host);

    return handler(normalized);
  };

const handlerFor = (
  method: 'GET' | 'POST',
): ((request: Request, context: RouteContext) => Promise<Response>) => {
  return async (request, context) => {
    const {tenant} = await context.params;

    /* A tenant the document does not name has no authentication to offer, and
     * the instance that would answer is the one every unnamed tenant shares —
     * mounted at whichever of them was asked for first, so it would report a
     * path it does not serve rather than the refusal this is. */
    if (!getTenantConfig(tenant)) {
      return new NextResponse('Not Found', {status: 404});
    }

    const handlers = toNextJsHandler(getAuth(tenant));

    return withAddressedHost(withRestoredBasePath(handlers[method]))(request);
  };
};

export const GET = handlerFor('GET');
export const POST = handlerFor('POST');
