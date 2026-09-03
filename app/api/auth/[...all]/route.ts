import {toNextJsHandler} from 'better-auth/next-js';

// ---- CORE IMPORTS ---- //
import {auth} from '@/lib/auth'; // path to your auth file
import {withBasePath} from '@/lib/core/path/base-path';
import {addressedHost} from '@/lib/core/tenant/routing';

const {POST: authPOST, GET: authGET} = toNextJsHandler(auth);

type AuthHandler = (request: Request) => Promise<Response>;

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

export const GET = withAddressedHost(withRestoredBasePath(authGET));
export const POST = withAddressedHost(withRestoredBasePath(authPOST));
