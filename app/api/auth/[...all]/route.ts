import {toNextJsHandler} from 'better-auth/next-js';

// ---- CORE IMPORTS ---- //
import {auth} from '@/lib/auth'; // path to your auth file
import {getBasePath} from '@/lib/core/path/base-path';
import {withPathPrefix} from '@/lib/core/path/utils';

const {POST: authPOST, GET: authGET} = toNextJsHandler(auth);

const basePath = getBasePath();

type AuthHandler = (request: Request) => Promise<Response>;

const withRestoredBasePath =
  (handler: AuthHandler): AuthHandler =>
  request => {
    if (!basePath) return handler(request);

    const url = new URL(request.url);
    const pathname = withPathPrefix(basePath, url.pathname);

    if (pathname !== url.pathname) {
      url.pathname = pathname;
      return handler(new Request(url.toString(), request));
    }

    return handler(request);
  };

export const GET = withRestoredBasePath(authGET);
export const POST = withRestoredBasePath(authPOST);
