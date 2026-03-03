import {findGooveeUserByEmail} from '@/orm/partner';
import {
  betterAuth,
  type BetterAuthOptions,
  defineErrorCodes,
} from 'better-auth';
import {APIError, getOAuthState} from 'better-auth/api';
import {nextCookies} from 'better-auth/next-js';
import {customSession} from 'better-auth/plugins';
import google from './core/auth/(ee)/google';
import keycloak from './core/auth/(ee)/keycloak';
import credentials from './core/auth/credentials';
import {register, registerByInvite, registerByKeycloak} from './core/auth/orm';

const showKeycloakOauth = process.env.SHOW_KEYCLOAK_OAUTH === 'true';

const ERROR_CODES = defineErrorCodes({
  TENANT_ID_REQUIRED: 'Tenant ID is required',
  PARTNER_NOT_FOUND: 'Partner not found',
  REGISTRATION_FAILED: 'Registration failed due to unexpected error',
});

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
                message: ERROR_CODES.TENANT_ID_REQUIRED,
              });
            }

            let partner = await findGooveeUserByEmail(
              user.email,
              data.tenantId,
            );
            if (!partner) {
              if (ctx.params?.id === 'google' && data.requestSignUp) {
                const signUp = data.inviteId ? registerByInvite : register;
                let res;
                try {
                  res = await signUp({...data, email: user.email});
                } catch (err) {
                  throw new APIError('UNPROCESSABLE_ENTITY', {
                    message: ERROR_CODES.REGISTRATION_FAILED,
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
              if (ctx.params?.providerId === 'keycloak') {
                // implicit signup with keycloak
                let res;
                try {
                  res = await registerByKeycloak({
                    email: user.email,
                    name: user.name,
                    workspaceURI: data.workspaceURI,
                    tenantId: data.tenantId,
                    locale: data.locale,
                  });
                } catch (err) {
                  throw new APIError('UNPROCESSABLE_ENTITY', {
                    message: ERROR_CODES.REGISTRATION_FAILED,
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
                message: ERROR_CODES.PARTNER_NOT_FOUND,
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
                message: ERROR_CODES.TENANT_ID_REQUIRED,
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
              message: ERROR_CODES.TENANT_ID_REQUIRED,
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
  plugins: [credentials, ...(showKeycloakOauth && keycloak ? [keycloak] : [])],
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
          message: ERROR_CODES.PARTNER_NOT_FOUND,
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
