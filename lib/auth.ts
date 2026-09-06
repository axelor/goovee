import {randomUUID} from 'node:crypto';

import {z} from 'zod';
import {findGooveeUserByEmail} from '@/orm/partner';
import {manager} from '@/tenant';
import {
  getGlobalConfig,
  getRoutingIndex,
  getTenantConfig,
  listTenantIds,
} from '@/tenant/config';
import {getPartnerImageURL} from '@/utils/files';
import {
  betterAuth,
  type BetterAuthOptions,
  defineErrorCodes,
} from 'better-auth';
import {APIError, getOAuthState} from 'better-auth/api';
import {
  SECURE_COOKIE_PREFIX,
  deleteSessionCookie,
  getCookieCache,
  parseCookies,
} from 'better-auth/cookies';
import {nextCookies} from 'better-auth/next-js';
import {customSession} from 'better-auth/plugins';
import {
  buildOAuthProviders,
  findOAuthRegistration,
} from './core/auth/(ee)/oauth-providers';
import {buildCredentials} from './core/auth/credentials';
import {register, registerByInvite, registerByKeycloak} from './core/auth/orm';
import {
  KeycloakRegisterSchema,
  OAuthInviteRegisterSchema,
  OAuthRegisterSchema,
} from './core/auth/validation-utils';
import {deploymentRootPath, withBasePath} from '@/lib/core/path/base-path';
import {tenantURLs} from '@/lib/core/url/scope';

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
                };

                const {success: inviteSuccess, data: inviteData} =
                  OAuthInviteRegisterSchema.safeParse(registrationData);

                if (inviteSuccess) {
                  try {
                    await client.$transaction(async txClient => {
                      await registerByInvite({
                        ...inviteData,
                        /* From the provider this callback arrived through, not
                         * from the body it carried. */
                        tenantId,
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
                        /* From the provider this callback arrived through, not
                         * from the body it carried. */
                        tenantId,
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
                      /* From the provider this callback arrived through, not
                       * from the body it carried. */
                      tenantId,
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
         * the tenant's own POST …/api/auth/update-session, which is gated on nothing but a valid
         * session — so a signed-in user could move their session to another
         * tenant and be resolved there as whoever holds their email. */
        input: false,
      },
    },
  },
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
 * refuses. The same list the proxy refuses a request outside of, so a host that
 * resolves no tenant is also one nothing authenticates on. Taken as written: the
 * document admits an origin only in its canonical spelling, so there is nothing
 * left to normalise. An image build holds a placeholder document naming no
 * tenant, and this list is then the deployment origin on its own.
 */
function authOrigins(): string[] {
  return [...getRoutingIndex().declaredOrigins];
}

/*
 * One authentication instance per tenant, built when the tenant is first
 * addressed and held from then on.
 *
 * Per tenant rather than one for the deployment, because the tenant is part of
 * every address authentication answers on: the instance is mounted under the
 * tenant's own segment, so which tenant a request authenticates against is
 * settled by where it arrived and nothing a caller sends can name another. The
 * cookie name carries the tenant too, so two tenants sharing an origin hold two
 * sessions in one browser rather than evicting each other.
 *
 * Built on first use rather than at module scope: `next build` evaluates this
 * file with a placeholder document that names no tenant, so a map composed up
 * front would be baked empty into the image. Held on `globalThis` because a
 * module is evaluated once per bundler layer and again on every recompile, and
 * a second set of instances would mint sessions the first set cannot read.
 */
declare global {
  var __tenantAuth: Map<string, ReturnType<typeof buildAuth>> | undefined;
}

/* For a tenant the document does not name. Random per process, so nothing it
 * signs survives a restart and no cookie written under a real tenant's secret
 * decrypts under it: an address naming an unknown tenant is answered as
 * unauthenticated rather than by an error a caller must tell apart from a
 * refusal. */
const UNKNOWN_TENANT_SECRET = randomUUID();

/**
 * The prefix a tenant's cookies are named with, giving `auth-acme.session_token`.
 *
 * One definition, because two sides depend on it: the instance writes cookies
 * under it, and `sessionTenantIds` reads them back. Deriving it twice is how
 * they come to disagree, and a disagreement is silent — a name nobody looks for
 * simply reads as no session at all.
 *
 * A change here renames every tenant's cookies, so every session in every
 * browser is dropped at once: the new names carry nothing and the old ones are
 * no longer read. That is the deliberate way out of a cookie whose attributes
 * have to change — a rename cannot be shadowed by what a browser already holds,
 * while reusing the name can.
 */
function cookiePrefixFor(tenantId: string): string {
  return `auth-${tenantId}`;
}

/**
 * Ends the session a request carries, and answers as though it had none.
 *
 * Through Better Auth's own `deleteSessionCookie`, which expires each cookie
 * with the attributes it was written under. Clearing by name alone leaves the
 * path off, and a browser then scopes the deletion to the directory the request
 * was made in — `/<tenant>/api/auth` — which never matches the deployment root
 * the cookies were written at. The cookies survive that, and every later request
 * repeats the work that ended this one.
 *
 * `null` is not in `customSession`'s return type, but Better Auth reads it as
 * unauthenticated; the cast keeps the branch out of the inferred type.
 */
function endSession(ctx: Parameters<Parameters<typeof customSession>[0]>[1]) {
  deleteSessionCookie(ctx);

  return null as never;
}

function buildAuth(tenantId: string) {
  const oauthProviders = buildOAuthProviders(tenantId);

  return betterAuth({
    ...options,
    secret:
      getTenantConfig(tenantId)?.betterAuthSecret ?? UNKNOWN_TENANT_SECRET,
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

      /* The tenant's own cookie names. Session cookies carry no domain and are
       * written for whichever host answered, so two tenants sharing an origin
       * would otherwise write the same name and each sign-in would evict the
       * other's session. Named per tenant, both are held at once and a browser
       * can be signed in to several tenants of one deployment.
       *
       * `sessionTenantIds` reads these names to tell whose sessions a request
       * carries, and derives them the same way; changing this shape obliges it. */
      cookiePrefix: cookiePrefixFor(tenantId),

      /* Confine the session cookies to the deployment. Better Auth writes them
       * at `/` — it knows nothing of the base path, whose only meaning to it is
       * that the endpoints happen to sit under one — so on a deployment served
       * under a base path they would be sent to every other address on that
       * host, including whatever else it serves.
       *
       * The deployment root and not the tenant's segment, so that `/` still
       * receives them: `sessionTenantIds` reads the cookies a request carries to
       * land a signed-in visitor on their own tenant, and an address above the
       * tenant is sent nothing scoped below it. It also keeps the path fixed for
       * the life of a deployment — a path that followed the tenant would move
       * when its routing did, and a cookie left at the old path outlives the
       * change and is read in preference to the new one, since a browser sends
       * the longer path first and the last value of a name is the one taken. */
      defaultCookieAttributes: {path: deploymentRootPath()},
    },
    /* Under the tenant's own segment, so the address names the tenant it
     * authenticates against. `tenantURLs` shapes it for how the tenant is routed:
     * no segment on an origin it holds to itself, its segment on one it shares. */
    basePath: withBasePath(tenantURLs(tenantId).forRouter('/api/auth')),

    /* The tenant's own error screen, under the tenant's segment like every
     * other address here. */
    onAPIError: {
      errorURL: withBasePath(tenantURLs(tenantId).forRouter('/auth/error')),
    },
    plugins: [
      /* This tenant's credentials endpoints. Built per instance so each closes
       * over the tenant it authenticates against, taken from the address the
       * instance is mounted at. */
      buildCredentials(tenantId),
      /* This tenant's own identity providers, and no other tenant's — see
       * `buildOAuthProviders`. Built per instance rather than shared, which is
       * what keeps a callback naming another tenant's provider from resolving
       * here at all. */
      ...(oauthProviders ? [oauthProviders] : []),
      customSession(async ({user, session}, ctx) => {
        /* The tenant this instance was built for, not the one the cookie claims.
         * Every cookie this instance can open should name it, since each tenant
         * signs with its own key — but two tenants given the same key would open
         * each other's, and then the tenant read from the payload would choose
         * the database while the address chose the instance. Refused rather than
         * trusted: the caller sees an ended session, which is what a cookie of
         * somebody else's tenant amounts to here. */
        if (session.tenantId !== tenantId) {
          return endSession(ctx);
        }

        const tenant = await manager.getTenant(tenantId);
        const partner =
          tenant &&
          user.email &&
          (await findGooveeUserByEmail(user.email, tenant.client));

        if (!partner) {
          /* The session outlived the partner it stands for — removed in AOS, or
           * moved out of the portal. Ended here so the visitor is asked to sign
           * in again rather than every request repeating this lookup. */
          return endSession(ctx);
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
                ? getPartnerImageURL(picture.id, tenantURLs(tenantId))
                : undefined,
          },
          session: session,
        };
      }, options),
      nextCookies(),
    ],
  });
}

/**
 * The authentication instance for a tenant, built once and reused.
 *
 * @throws nothing for a tenant the document does not name — an instance is
 *   still returned, and every lookup through it resolves no tenant, so a
 *   request naming an unknown tenant is answered as unauthenticated rather than
 *   by an error a caller would have to tell apart from a refusal.
 */
export function getAuth(tenantId: string): Auth {
  const instances = (global.__tenantAuth ??= new Map());

  /* The id reaching here is a path segment, and nothing upstream checks it
   * against the document: a route handler takes it from `params`, and
   * `getSession` takes it from the tenant header. Keying on the id that
   * resolves means made-up ids share one instance instead of each taking a
   * slot in a map that is never evicted from — otherwise a series of requests
   * naming nothing builds a full authentication instance apiece and the heap
   * grows with them.
   *
   * That shared instance signs nothing and opens nothing: it carries a secret
   * no cookie was written under, so a session read through it is absent, which
   * is the answer an unknown tenant should give. */
  const key = getTenantConfig(tenantId) ? tenantId : '';

  let instance = instances.get(key);

  if (!instance) {
    instance = buildAuth(tenantId);
    instances.set(key, instance);
  }

  return instance;
}

export type Auth = ReturnType<typeof buildAuth>;

let cookieReadFailureReported = false;

/**
 * The tenants a request carries a signed-in session for.
 *
 * Two steps, and the order is the point. Cookie *names* carry the tenant, so
 * they say which of a deployment's tenants a request might be signed in to —
 * but a name is whatever the browser sends, so that is a lookup key and nothing
 * more. What is returned comes from inside the cookie: each candidate is opened
 * with that tenant's own secret, and the tenant is read from the payload. A name
 * whose cookie will not open under the secret it claims yields nothing, so an
 * invented cookie buys no answer.
 *
 * Usually empty or one entry, and one decryption. Several are legitimate:
 * tenants sharing an origin write different names, so one browser holds a
 * session for each tenant it signed in to.
 *
 * Read from the cookie rather than through `getSession()`, which runs the
 * customSession enrichment — a partner lookup — on every call, while the tenant
 * is already in the cookie and cannot change for the life of a session.
 *
 */
export async function sessionTenantIds(headers: Headers): Promise<string[]> {
  const cookies = parseCookies(headers.get('cookie') ?? '');

  const candidates = listTenantIds().filter(tenantId => {
    const prefix = cookiePrefixFor(tenantId);

    return (
      cookies.has(`${prefix}.session_token`) ||
      cookies.has(`${SECURE_COOKIE_PREFIX}${prefix}.session_token`)
    );
  });

  const confirmed: string[] = [];

  for (const candidate of candidates) {
    try {
      const {secret, authCookies} = await getAuth(candidate).$context;

      const cached = await getCookieCache(headers, {
        secret,
        /* Named, because this defaults to better-auth's own prefix while every
         * cookie here is written under the tenant's. Left out, the read finds
         * nothing and every request looks signed out. */
        cookiePrefix: cookiePrefixFor(candidate),
        strategy: options.session.cookieCache.strategy,
        isSecure: authCookies.sessionData.name.startsWith(SECURE_COOKIE_PREFIX),
      });

      const tenantId: unknown = cached?.session.tenantId;

      if (typeof tenantId === 'string') confirmed.push(tenantId);
    } catch (err) {
      /* Not expected: an undecodable cookie, or one written under another
       * secret, reads as absent rather than throwing. Caught so a library that
       * starts throwing costs this answer rather than the request, and reported
       * once — it would be the same failure every time. */
      if (!cookieReadFailureReported) {
        cookieReadFailureReported = true;
        console.error(
          'Failed to read the tenant from the session cookie:',
          err,
        );
      }
    }
  }

  return confirmed;
}
