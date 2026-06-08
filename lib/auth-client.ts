import {createAuthClient} from 'better-auth/react';
import type {Credentials} from './core/auth/credentials';
import {
  customSessionClient,
  genericOAuthClient,
} from 'better-auth/client/plugins';
import type {Auth} from './auth';
import {withBasePath} from '@/lib/core/path/base-path';

/*
 * NOTE: better-auth refetches the session on window focus by default (refetchOnWindowFocus: true).
 * This causes `session.user` to get a new object reference on every tab refocus, even when the
 * underlying data hasn't changed. Avoid using the `user` object directly in useEffect/useCallback
 * dependency arrays — use a stable primitive like `user?.id` instead to prevent unintended re-runs.
 */

export const authClient = createAuthClient({
  basePath: withBasePath('/api/auth'),
  plugins: [
    {
      id: 'credentials',
      $InferServerPlugin: {} as Credentials,
    },
    genericOAuthClient(),
    customSessionClient<Auth>(),
  ],
});
