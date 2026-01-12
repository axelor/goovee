import {createAuthClient} from 'better-auth/react';
import type {Credentials} from './core/auth/credentials';
import {
  customSessionClient,
  genericOAuthClient,
} from 'better-auth/client/plugins';
import type {Auth} from './auth';

export const authClient = createAuthClient({
  plugins: [
    {
      id: 'credentials',
      $InferServerPlugin: {} as Credentials,
    },
    genericOAuthClient(),
    customSessionClient<Auth>(),
  ],
});
