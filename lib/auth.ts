import {z} from 'zod';
import {findGooveeUserByEmail} from '@/orm/partner';
import {manager} from '@/tenant';
import {getGlobalConfigSync} from '@/tenant/config-provider';
import {getPartnerImageURL} from '@/utils/files';
import {
  betterAuth,
  type BetterAuthOptions,
  defineErrorCodes,
} from 'better-auth';
import {APIError, getOAuthState} from 'better-auth/api';
import {nextCookies} from 'better-auth/next-js';
import {customSession} from 'better-auth/plugins';
import oauthProviders from './core/auth/(ee)/oauth-providers';
import credentials from './core/auth/credentials';
import {register, registerByInvite, registerByKeycloak} from './core/auth/orm';
import {
  KeycloakRegisterSchema,
  OAuthInviteRegisterSchema,
  OAuthRegisterSchema,
} from './core/auth/validation-utils';
import {withBasePath} from '@/lib/core/path/base-path';

const ERROR_CODES = defineErrorCodes({
  TENANT_ID_REQUIRED: 'Tenant ID is required',
  PARTNER_NOT_FOUND: 'Partner not found',
  REGISTRATION_FAILED: 'Registration failed',
});

const options = {
  onAPIError: {
    errorURL: withBasePath('/auth/error'),
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
              throw new APIError(
                'UNPROCESSABLE_ENTITY',
                ERROR_CODES.TENANT_ID_REQUIRED,
              );
            }

            const tenant = await manager.getTenant(data.tenantId);
            if (!tenant) {
              throw new APIError(
                'UNPROCESSABLE_ENTITY',
                ERROR_CODES.TENANT_ID_REQUIRED,
              );
            }
            const {client, config} = tenant;

            /* OAuth applications are per-tenant, registered as generic
             * providers under "<provider>-<tenantId>". */
            const isGoogle = ctx.params?.providerId?.startsWith('google-');
            const isKeycloak = ctx.params?.providerId?.startsWith('keycloak-');

            let partner = await findGooveeUserByEmail(user.email, client);
            if (!partner) {
              if (isGoogle && data.requestSignUp) {
                const registrationData = {
                  ...data,
                  email: user.email,
                };

                const {success: inviteSuccess, data: inviteData} =
                  OAuthInviteRegisterSchema.safeParse(registrationData);

                if (inviteSuccess) {
                  try {
                    await client.$transaction(async txClient => {
                      await registerByInvite({
                        ...inviteData,
                        client: txClient,
                        config,
                      });
                    });
                  } catch (err) {
                    if (err instanceof APIError) throw err;
                    throw new APIError('UNPROCESSABLE_ENTITY', {
                      message:
                        err instanceof Error
                          ? err.message
                          : ERROR_CODES.REGISTRATION_FAILED.message,
                    });
                  }
                } else {
                  const {
                    success: registerSuccess,
                    data: registerData,
                    error: registerError,
                  } = OAuthRegisterSchema.safeParse(registrationData);

                  if (!registerSuccess) {
                    throw new APIError('UNPROCESSABLE_ENTITY', {
                      message: z.prettifyError(registerError),
                    });
                  }

                  try {
                    await client.$transaction(async txClient => {
                      await register({
                        ...registerData,
                        client: txClient,
                        config,
                      });
                    });
                  } catch (err) {
                    if (err instanceof APIError) throw err;
                    throw new APIError('UNPROCESSABLE_ENTITY', {
                      message:
                        err instanceof Error
                          ? err.message
                          : ERROR_CODES.REGISTRATION_FAILED.message,
                    });
                  }
                }

                partner = await findGooveeUserByEmail(user.email, client);
              }
              if (isKeycloak) {
                const {
                  success,
                  data: keycloakData,
                  error: keycloakError,
                } = KeycloakRegisterSchema.safeParse({
                  email: user.email,
                  name: user.name,
                  tenantId: data.tenantId,
                  workspaceURI: data.workspaceURI,
                  locale: data.locale,
                });

                if (!success) {
                  throw new APIError('UNPROCESSABLE_ENTITY', {
                    message: z.prettifyError(keycloakError),
                  });
                }

                try {
                  await client.$transaction(async txClient => {
                    await registerByKeycloak({
                      ...keycloakData,
                      client: txClient,
                    });
                  });
                } catch (err) {
                  if (err instanceof APIError) throw err;
                  throw new APIError('UNPROCESSABLE_ENTITY', {
                    message:
                      err instanceof Error
                        ? err.message
                        : ERROR_CODES.REGISTRATION_FAILED.message,
                  });
                }

                partner = await findGooveeUserByEmail(user.email, client);
              }
            }

            if (!partner) {
              throw new APIError(
                'UNPROCESSABLE_ENTITY',
                ERROR_CODES.PARTNER_NOT_FOUND,
              );
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
              throw new APIError(
                'UNPROCESSABLE_ENTITY',
                ERROR_CODES.TENANT_ID_REQUIRED,
              );
            }
            return {
              data: {
                ...session,
                tenantId: data.tenantId,
              },
            };
          }

          if (!session.tenantId) {
            throw new APIError(
              'UNPROCESSABLE_ENTITY',
              ERROR_CODES.TENANT_ID_REQUIRED,
            );
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
  plugins: [credentials, ...(oauthProviders ? [oauthProviders] : [])],
} satisfies BetterAuthOptions;

/* Deployment-wide auth settings come from the document's "$global" section
 * (the provider loads synchronously and taints the secret at load). */
const globalConfig = getGlobalConfigSync();

export const auth = betterAuth({
  ...options,
  secret: globalConfig.betterAuthSecret,
  baseURL: globalConfig.betterAuthUrl,
  basePath: withBasePath('/api/auth'),
  plugins: [
    ...options.plugins,
    customSession(async ({user, session}, ctx) => {
      const {tenantId} = session;
      const tenant = tenantId ? await manager.getTenant(tenantId) : null;
      const partner =
        tenant &&
        user.email &&
        (await findGooveeUserByEmail(user.email, tenant.client));

      if (!partner) {
        // Session cookie exists but partner no longer found — clear cookies and treat as no session
        // customSession types don't accept null but better-auth handles it as unauthenticated
        const cookies = ctx.context.authCookies;
        ctx.setCookie(cookies.sessionToken.name, '', {maxAge: 0});
        ctx.setCookie(cookies.sessionData.name, '', {maxAge: 0});
        ctx.setCookie(cookies.accountData.name, '', {maxAge: 0});
        ctx.setCookie(cookies.dontRememberToken.name, '', {maxAge: 0});
        // Cast to `never` so this branch is excluded from the function’s inferred return type.
        return null as never;
      }

      const {
        id,
        emailAddress,
        fullName: name = '',
        simpleFullName = '',
        isContact,
        mainPartner,
        partnerCategory,
        localization,
        picture,
      } = partner;

      return {
        user: {
          id,
          name,
          email: emailAddress?.address || user.email,
          isContact,
          simpleFullName,
          mainPartnerId: isContact ? mainPartner?.id : undefined,
          partnerCategoryId: isContact
            ? mainPartner?.partnerCategory?.id
            : partnerCategory?.id,
          tenantId,
          locale: localization?.code,
          image:
            picture?.id && tenantId
              ? getPartnerImageURL(picture.id, tenantId)
              : undefined,
        },
        session: session,
      };
    }, options),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
