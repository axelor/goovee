import type {BetterAuthPlugin} from 'better-auth';
import {createAuthEndpoint} from 'better-auth/api';
import {setSessionCookie} from 'better-auth/cookies';
import {z} from 'zod';

import {findGooveeUserByEmail} from '@/orm/partner';
import {compare} from '@/auth/utils';

const credentials = {
  id: 'credentials',
  endpoints: {
    signInWithCredentials: createAuthEndpoint(
      '/credentials/sign-in',
      {
        method: 'POST',
        body: z.object({
          email: z.email(),
          password: z.string(),
          tenantId: z.string(),
        }),
        metadata: {
          openapi: {
            summary: 'Sign in with email and password',
            tags: ['auth'],
          },
        },
      },
      async ctx => {
        const {email, password, tenantId} = ctx.body;

        const user = await findGooveeUserByEmail(email, tenantId);
        if (!user) {
          throw ctx.error('UNAUTHORIZED', {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          });
        }

        if (!user.password) {
          throw ctx.error('UNAUTHORIZED', {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          });
        }

        const valid = await compare(password, user.password);
        if (!valid) {
          throw ctx.error('UNAUTHORIZED', {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          });
        }

        const session = await ctx.context.internalAdapter.createSession(
          user.id,
          false,
          {tenantId},
        );
        await setSessionCookie(
          ctx,
          {
            session,
            user: {
              id: user.id,
              name: user.fullName || '',
              email: user.emailAddress?.address || email,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          false,
        );
        return session;
      },
    ),
  },
  rateLimit: [
    {
      pathMatcher: path => path === '/credentials/sign-in',
      window: 60_000,
      max: 5,
    },
  ],

  $ERROR_CODES: {
    INVALID_CREDENTIALS: 'Invalid credentials',
  },
} satisfies BetterAuthPlugin;

export type Credentials = typeof credentials;
export default credentials;
