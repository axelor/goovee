import crypto from 'node:crypto';

import type {BetterAuthPlugin} from 'better-auth';
import {APIError, createAuthEndpoint, sessionMiddleware} from 'better-auth/api';
import {setSessionCookie} from 'better-auth/cookies';
import {symmetricDecrypt, symmetricEncrypt} from 'better-auth/crypto';
import {z} from 'zod';

import {MOBILE_AUTH_RETURN_URL} from './contract';

/* How long the app has to complete a sign-in after the browser hands it over. */
const HANDOVER_LIFETIME_MS = 3 * 60 * 1000;

/* The SHA-256 of a secret, base64url: 43 characters. */
const ChallengeSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

/*
 * A path on this portal to continue to. Only a path: an address that leaves the
 * portal is refused, so the handover cannot be made to forward a session.
 * Browsers drop control characters from an address, which would turn
 * `/<tab>/other.site` into `//other.site`, so those are refused too, and the
 * path must resolve to the origin it is read against.
 */
const ContinuePathSchema = z
  .string()
  .refine(
    path =>
      path.startsWith('/') &&
      !path.startsWith('//') &&
      !path.includes('\\') &&
      !/[\u0000-\u001F\u007F]/.test(path) &&
      new URL(path, 'https://portal.invalid').origin ===
        'https://portal.invalid',
    {error: 'Expected a path on this portal'},
  );

const HandoverSchema = z.object({
  session: z.looseObject({token: z.string()}),
  user: z.looseObject({id: z.string()}),
  challenge: ChallengeSchema,
  callbackURL: ContinuePathSchema,
  expiresAt: z.number(),
});

type SessionPair = Parameters<typeof setSessionCookie>[1];

/* JSON carries dates as strings; the session and user records want them back. */
function reviveDates(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      key.endsWith('At') && typeof value === 'string' ? new Date(value) : value,
    ]),
  );
}

function challengeOf(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/*
 * Hands a session signed in through the phone's browser over to the mobile app.
 *
 * The browser finishes signing in at `finish`, which seals this tenant's
 * session, together with the hash the app sent along, into a short-lived token
 * encrypted with the tenant's secret, and redirects to the app with the token
 * and the `exchange` address. The app posts the token and the secret behind the
 * hash to `exchange` from a page of this portal in its WebView; `exchange`
 * checks them and sets the same session there. The app and the browser then
 * share one session. Nothing is stored, so any server of the deployment can
 * complete either step.
 *
 * `exchange` takes JSON only. An HTML form, including one in user-written
 * content, cannot send JSON, and a page of another site cannot post it here
 * without the portal allowing it, so neither can sign a visitor into somebody
 * else's account; and the secrets stay out of addresses and their logs.
 */
export function signInHandover() {
  return {
    id: 'sign-in-handover',
    endpoints: {
      finishSignInHandover: createAuthEndpoint(
        '/mobile/handover/finish',
        {
          method: 'GET',
          use: [sessionMiddleware],
          query: z.object({
            challenge: ChallengeSchema,
            callbackURL: ContinuePathSchema,
          }),
        },
        async ctx => {
          const {session, user} = ctx.context.session;
          const token = await symmetricEncrypt({
            key: ctx.context.secret,
            data: JSON.stringify({
              session,
              user,
              challenge: ctx.query.challenge,
              callbackURL: ctx.query.callbackURL,
              expiresAt: Date.now() + HANDOVER_LIFETIME_MS,
            }),
          });
          const destination = new URL(MOBILE_AUTH_RETURN_URL);
          destination.searchParams.set(
            'exchange',
            `${ctx.context.baseURL}/mobile/handover/exchange`,
          );
          destination.searchParams.set('token', token);
          throw ctx.redirect(destination.toString());
        },
      ),
      exchangeSignInHandover: createAuthEndpoint(
        '/mobile/handover/exchange',
        {
          method: 'POST',
          body: z.object({
            token: z.string().min(1),
            verifier: z.string().min(43).max(128),
          }),
        },
        async ctx => {
          const contentType = ctx.request?.headers.get('content-type') ?? '';
          if (!contentType.startsWith('application/json')) {
            throw new APIError('UNSUPPORTED_MEDIA_TYPE', {
              message: 'Expected JSON',
            });
          }

          let handover: z.infer<typeof HandoverSchema>;
          try {
            handover = HandoverSchema.parse(
              JSON.parse(
                await symmetricDecrypt({
                  key: ctx.context.secret,
                  data: ctx.body.token,
                }),
              ),
            );
          } catch {
            throw new APIError('BAD_REQUEST', {
              message: 'Invalid sign-in handover',
            });
          }

          const expected = Buffer.from(handover.challenge);
          const given = Buffer.from(challengeOf(ctx.body.verifier));
          if (
            handover.expiresAt < Date.now() ||
            expected.length !== given.length ||
            !crypto.timingSafeEqual(expected, given)
          ) {
            throw new APIError('BAD_REQUEST', {
              message: 'Invalid sign-in handover',
            });
          }

          await setSessionCookie(ctx, {
            session: reviveDates(handover.session),
            user: reviveDates(handover.user),
          } as SessionPair);
          return ctx.json({callbackURL: handover.callbackURL});
        },
      ),
    },
  } satisfies BetterAuthPlugin;
}
