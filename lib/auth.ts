import {z} from 'zod';
import {findGooveeUserByEmail} from '@/orm/partner';
import {manager} from '@/tenant';
import {getGlobalConfig, listTenantConfigs} from '@/tenant/config-provider';
import {getPartnerImageURL} from '@/utils/files';
import {
  betterAuth,
  type BetterAuthOptions,
  defineErrorCodes,
} from 'better-auth';
import {APIError, getOAuthState} from 'better-auth/api';
import {
  SECURE_COOKIE_PREFIX,
  getCookieCache,
  parseCookies,
} from 'better-auth/cookies';
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
const globalConfig = getGlobalConfig();

/* The origin the addresses carrying no tenant of their own are served on. Parsed
 * once, here, because the document admits only origins and so this cannot throw
 * — including for the placeholder document an image build holds. */
const deploymentOrigin = new URL(globalConfig.betterAuthUrl);

/**
 * The origins this deployment authenticates on.
 *
 * Better Auth resolves each request's origin from its host and matches it
 * against this list; every absolute address it builds and every origin it trusts
 * follow. So a tenant served on an origin of its own has its OAuth redirect
 * address built there rather than on the deployment's. Session cookies do not
 * follow: they carry no domain, so each belongs to the host that answered the
 * request. A host absent from the list is answered under `betterAuthUrl`.
 *
 * Whole origins rather than the bare hosts the field also accepts: a bare host is
 * trusted at https, and at http only for a loopback name, so a deployment served
 * over plain http on a name that resolves elsewhere would have its own origin
 * refused as untrusted.
 *
 * Read from what each tenant declares as the origin it is served on, so an origin
 * the rest of the application builds links to cannot be one authentication
 * refuses. Taken as written: the document admits an origin only in its canonical
 * spelling, so there is nothing left to normalise. An image build holds a
 * placeholder document naming no tenant, and this list is then the deployment
 * origin on its own.
 */
function authOrigins(): string[] {
  const declared = listTenantConfigs().map(
    ([, config]) => config.publicEnv.GOOVEE_PUBLIC_HOST,
  );

  return [...new Set([globalConfig.betterAuthUrl, ...declared])];
}

export const auth = betterAuth({
  ...options,
  secret: globalConfig.betterAuthSecret,
  baseURL: {
    allowedHosts: authOrigins(),
    /* Where a request arriving on a host the list does not hold is answered: the
     * addresses carrying no tenant of their own are served on this origin. Given
     * one, because an unmatched host throws when there is none. */
    fallback: globalConfig.betterAuthUrl,
    /* Stated rather than derived. Given as "auto" or left out, the `__Secure-`
     * prefix on the session cookie names follows NODE_ENV rather than the scheme
     * the deployment is served on, and a production build behind plain http would
     * then name cookies the browser refuses to store, so nobody could sign in.
     * Every origin above shares this scheme; the document refuses a tenant whose
     * does not. */
    protocol: deploymentOrigin.protocol === 'https:' ? 'https' : 'http',
  },
  advanced: {
    /* Resolving an origin per request reads `x-forwarded-host` ahead of the
     * `host` header, and the library trusts it unless told otherwise. Stated
     * here because leaving it implicit hides an obligation on the deployment:
     * the proxy in front has to overwrite that header rather than pass a
     * client's own through, since whoever sets it chooses which of the origins
     * above the request is answered under. `x-forwarded-proto` is never read —
     * the protocol above is fixed. */
    trustedProxyHeaders: true,
  },
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

let cookieReadFailureReported = false;

/* The tenant a session belongs to. Read from the encrypted (JWE) session-data
 * cookie rather than through `auth.api.getSession()`, which runs the
 * customSession enrichment — a partner lookup in the session's tenant — on
 * every call, including every <Link> prefetch, while the tenant id is already
 * in the cookie and cannot change for the life of a session.
 *
 * The secret, the token cookie's name and the session-data cookie's `__Secure-`
 * prefix all come from the auth instance, since a cookie reader left to itself
 * resolves them from things that do not describe this deployment: the secret
 * from BETTER_AUTH_SECRET, which is not where this deployment keeps it — the
 * configuration document is — and the prefix from the build mode, while the
 * cookie is written with it or without it according to the scheme the configured
 * origins are served on. Both mistakes are invisible: a cookie looked for under
 * the wrong name reads as absent, and every request then takes the expensive
 * path in silence. Giving better-auth a `cookiePrefix` or a custom cookie name
 * under `advanced` obliges an update here — the read below still assumes its
 * default names. */
export async function getSessionTenantId(
  headers: Headers,
): Promise<string | undefined> {
  const {secret, authCookies} = await auth.$context;

  /* Nothing to read for a visitor holding no session token. Matched by the
   * instance's own name for it: a name this failed to recognise would make
   * every request look anonymous, and a caller checking a session against the
   * tenant it is reaching would let all of them through. */
  const cookies = parseCookies(headers.get('cookie') ?? '');

  if (!cookies.has(authCookies.sessionToken.name)) {
    return undefined;
  }

  try {
    const cached = await getCookieCache(headers, {
      secret,
      strategy: options.session.cookieCache.strategy,
      isSecure: authCookies.sessionData.name.startsWith(SECURE_COOKIE_PREFIX),
    });

    const cachedTenantId: unknown = cached?.session.tenantId;

    if (typeof cachedTenantId === 'string') {
      return cachedTenantId;
    }
  } catch (err) {
    /* Not expected: no cookie makes the read throw, since an undecodable one,
     * or one written under another secret, reads as absent. Caught so that a
     * library that starts throwing costs a full session lookup rather than the
     * request, and reported once — it would be the same failure every time. */
    if (!cookieReadFailureReported) {
      cookieReadFailureReported = true;
      console.error('Failed to read the tenant from the session cookie:', err);
    }
  }

  const session = await auth.api.getSession({headers});

  return session?.user.tenantId ?? undefined;
}
