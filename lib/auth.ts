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
import oauthProviders, {
  findOAuthRegistration,
} from './core/auth/(ee)/oauth-providers';
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
  PROVIDER_NOT_REGISTERED: 'Unknown sign-in provider',
  TENANT_NOT_FOUND: 'Tenant not found',
  TENANT_ID_IMMUTABLE: 'A session cannot change tenant',
  EMAIL_REQUIRED: 'Email is required',
  PARTNER_NOT_FOUND: 'Partner not found',
  REGISTRATION_FAILED: 'Registration failed',
});

/* The route an OAuth callback arrives on, matched by both hooks below to
 * recognise one. The path belongs to the generic OAuth plugin, so a plugin
 * upgrade that moves the callback leaves both hooks matching nothing: the
 * sign-in is then refused for a session carrying no tenant, rather than one
 * being issued without a tenant behind it. */
const OAUTH_CALLBACK_PATH = '/oauth2/callback/:providerId';

const options = {
  onAPIError: {
    errorURL: withBasePath('/auth/error'),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (ctx?.path === OAUTH_CALLBACK_PATH) {
            /* Which tenant this callback acts on is read from the provider it
             * arrived through, not from the state: the state is what the caller
             * posted when starting the flow, so trusting the tenant it names
             * would let one tenant's identity provider vouch for another
             * tenant's users. */
            const registration = findOAuthRegistration(ctx.params?.providerId);
            if (!registration) {
              throw new APIError(
                'UNAUTHORIZED',
                ERROR_CODES.PROVIDER_NOT_REGISTERED,
              );
            }

            const {provider, tenantId} = registration;

            if (!user.email) {
              throw new APIError(
                'UNPROCESSABLE_ENTITY',
                ERROR_CODES.EMAIL_REQUIRED,
              );
            }

            const data = await getOAuthState();

            const tenant = await manager.getTenant(tenantId);
            if (!tenant) {
              throw new APIError(
                'UNPROCESSABLE_ENTITY',
                ERROR_CODES.TENANT_NOT_FOUND,
              );
            }
            const {client, config} = tenant;

            let partner = await findGooveeUserByEmail(user.email, client);
            if (!partner) {
              if (provider === 'google' && data?.requestSignUp) {
                const registrationData = {
                  ...data,
                  email: user.email,
                  tenantId,
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
              if (provider === 'keycloak') {
                const {
                  success,
                  data: keycloakData,
                  error: keycloakError,
                } = KeycloakRegisterSchema.safeParse({
                  email: user.email,
                  name: user.name,
                  tenantId,
                  workspaceURI: data?.workspaceURI,
                  locale: data?.locale,
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
          if (ctx?.path === OAUTH_CALLBACK_PATH) {
            /* The session's tenant is set from the provider's registration, so
             * a session cannot be issued for a tenant other than the one whose
             * identity provider just authenticated the user. */
            const registration = findOAuthRegistration(ctx.params?.providerId);
            if (!registration) {
              throw new APIError(
                'UNAUTHORIZED',
                ERROR_CODES.PROVIDER_NOT_REGISTERED,
              );
            }

            return {
              data: {
                ...session,
                tenantId: registration.tenantId,
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
      update: {
        before: async (session: Record<string, unknown>) => {
          /* The tenant belongs to the sign-in that established the session, so
           * an update carrying one would move an authenticated session to a
           * tenant nothing checked the credential against. Refused here as well
           * as in the field declaration, because a session row can also be
           * updated directly rather than through the API. */
          if ('tenantId' in session) {
            throw new APIError('BAD_REQUEST', ERROR_CODES.TENANT_ID_IMMUTABLE);
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
        /* Create-only: a session's tenant is settled by the sign-in that
         * authenticated the user against that tenant. Any session field
         * better-auth accepts as input can be rewritten through
         * POST /api/auth/update-session, which is gated on nothing but a valid
         * session — so a signed-in user could move their session to another
         * tenant and be resolved there as whoever holds their email. */
        input: false,
      },
    },
  },
  plugins: [credentials, ...(oauthProviders ? [oauthProviders] : [])],
} satisfies BetterAuthOptions;

/* Deployment-wide auth settings come from the document's "$global" section
 * (the provider loads synchronously and marks the secret at load). */
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
