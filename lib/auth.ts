import {findGooveeUserByEmail} from '@/orm/partner';
import {betterAuth, type BetterAuthOptions} from 'better-auth';
import {APIError, getOAuthState} from 'better-auth/api';
import {nextCookies} from 'better-auth/next-js';
import {customSession} from 'better-auth/plugins';
import google from './core/auth/(ee)/google';
import keycloak from './core/auth/(ee)/keycloak';
import credentials from './core/auth/credentials';
import {register, registerByInvite} from './core/auth/orm';

const options = {
  onAPIError: {
    errorURL: '/auth/error',
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (
            ctx?.path === '/callback/:id' ||
            ctx?.path === '/oauth2/callback/:providerId'
          ) {
            const data = await getOAuthState();
            if (!data?.tenantId || !user.email) {
              throw new APIError('UNPROCESSABLE_ENTITY', {
                message: 'Tenant ID is required',
              });
            }

            let partner = await findGooveeUserByEmail(
              user.email,
              data.tenantId,
            );
            if (!partner && ctx.params?.id === 'google') {
              if (data.requestSignUp) {
                const signUp = data.inviteId ? registerByInvite : register;
                let res;
                try {
                  res = await signUp({...data, email: user.email});
                } catch (err) {
                  throw new APIError('UNPROCESSABLE_ENTITY', {
                    message: 'Registration failed due to unexpected error',
                  });
                }
                if ('error' in res) {
                  throw new APIError('UNPROCESSABLE_ENTITY', {
                    message: res.message,
                  });
                }
                partner = await findGooveeUserByEmail(
                  user.email,
                  data.tenantId,
                );
              }
            }

            if (!partner) {
              throw new APIError('UNPROCESSABLE_ENTITY', {
                message: 'Partner not found',
              });
            }
          }
          return {data: user};
        },
      },
    },
    session: {
      create: {
        before: async (session, ctx) => {
          if (
            ctx?.path === '/callback/:id' ||
            ctx?.path === '/oauth2/callback/:providerId'
          ) {
            const data = await getOAuthState();
            if (!data?.tenantId) {
              throw new APIError('UNPROCESSABLE_ENTITY', {
                message: 'Tenant ID is required',
              });
            }
            return {
              data: {
                ...session,
                tenantId: data.tenantId,
              },
            };
          }

          if (!session.tenantId) {
            throw new APIError('UNPROCESSABLE_ENTITY', {
              message: 'Tenant ID is required',
            });
          }

          return {data: session};
        },
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days cache duration
      strategy: 'jwe',
      refreshCache: true,
    },
    additionalFields: {
      tenantId: {
        type: 'string',
        required: false,
      },
    },
  },
  plugins: [keycloak, credentials],
  socialProviders: {google},
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...options.plugins,
    customSession(async ({user, session}) => {
      const {tenantId} = session;
      const partner =
        tenantId &&
        user.email &&
        (await findGooveeUserByEmail(user.email, tenantId));

      if (!partner) {
        throw new APIError('UNPROCESSABLE_ENTITY', {
          message: 'Partner not found',
        });
      }

      const {
        id,
        emailAddress,
        fullName: name = '',
        simpleFullName = '',
        isContact,
        mainPartner,
        localization,
      } = partner;

      return {
        user: {
          id,
          name,
          email: emailAddress?.address || user.email,
          isContact,
          simpleFullName,
          mainPartnerId: isContact ? mainPartner?.id : undefined,
          tenantId,
          locale: localization?.code,
          image: user.image,
        },
        session: session,
      };
    }, options),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
