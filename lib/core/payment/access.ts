import 'server-only';

import {createHmac, timingSafeEqual} from 'node:crypto';
import type {ResponseCookies} from 'next/dist/compiled/@edge-runtime/cookies';
import type {ReadonlyRequestCookies} from 'next/dist/server/web/spec-extension/adapters/request-cookies';

import type {Tenant, TenantConfig} from '@/tenant';
import {isSameEmail} from './domain/email';

/*
 * Who may see a payment: the browser that came back from the provider, which
 * the return route gave a cookie scoped to that payment, or the signed-in payer.
 * The reference itself grants nothing; it sits in provider back offices and
 * logs.
 */

const COOKIE_PREFIX = 'goovee_payment_';

const COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;

export function paymentCookieName(reference: string): string {
  return `${COOKIE_PREFIX}${reference}`;
}

/* `<expiry>.<hex signature>`: the expiry is signed in, so a leaked value stops
 * working when the cookie would have, whatever the browser does with maxAge. */
const COOKIE_VALUE = /^(\d{1,16})\.([0-9a-f]{64})$/;

function sign(tenant: Tenant, reference: string, expiresAt: number): string {
  return createHmac('sha256', tenant.config.sessionSecret)
    .update(`payment:${reference}:${expiresAt}`)
    .digest('hex');
}

/*
 * A grant for a return leg that carries no provider fact of its own, such as
 * the address a bank sends the browser back to. Put on the return address at
 * session creation, known only to the provider and the payer's browser, and
 * checked before the route treats the reference as attested.
 */
/* `<expiry>.<hex signature>`, like the cookie: a report address that leaks
 * later, from a log or a history, stops minting cookies when the grant runs
 * out. */
const GRANT_VALUE = /^(\d{1,16})\.([0-9a-f]{64})$/;

function signGrant(
  config: TenantConfig,
  reference: string,
  expiresAt: number,
): string {
  return createHmac('sha256', config.sessionSecret)
    .update(`return:${reference}:${expiresAt}`)
    .digest('hex');
}

export function signReturnGrant(
  config: TenantConfig,
  reference: string,
  lifetimeSeconds: number,
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + lifetimeSeconds;
  return `${expiresAt}.${signGrant(config, reference, expiresAt)}`;
}

export function verifyReturnGrant(
  config: TenantConfig,
  reference: string,
  grant: string | null,
): boolean {
  const match = grant ? GRANT_VALUE.exec(grant) : null;
  if (!match) {
    return false;
  }
  const expiresAt = Number(match[1]);
  if (expiresAt * 1000 < Date.now()) {
    return false;
  }
  return timingSafeEqual(
    Buffer.from(match[2], 'hex'),
    Buffer.from(signGrant(config, reference, expiresAt), 'hex'),
  );
}

export function setPaymentCookie(
  cookies: ResponseCookies,
  tenant: Tenant,
  reference: string,
): void {
  const expiresAt = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SECONDS;
  cookies.set(
    paymentCookieName(reference),
    `${expiresAt}.${sign(tenant, reference, expiresAt)}`,
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: COOKIE_MAX_AGE_SECONDS,
    },
  );
}

export function hasPaymentCookie(
  cookies: ReadonlyRequestCookies,
  tenant: Tenant,
  reference: string,
): boolean {
  const presented = cookies.get(paymentCookieName(reference))?.value;
  const match = presented ? COOKIE_VALUE.exec(presented) : null;
  if (!match) {
    return false;
  }
  const expiresAt = Number(match[1]);
  if (expiresAt * 1000 < Date.now()) {
    return false;
  }
  const expected = sign(tenant, reference, expiresAt);
  return timingSafeEqual(
    Buffer.from(match[2], 'hex'),
    Buffer.from(expected, 'hex'),
  );
}

/** Cookie or session: the return leg's cookie, or a signed-in user who is the payer. */
export function canViewPayment({
  cookies,
  tenant,
  reference,
  payer,
  userEmail,
}: {
  cookies: ReadonlyRequestCookies;
  tenant: Tenant;
  reference: string;
  payer: string | null;
  userEmail: string | null | undefined;
}): boolean {
  if (hasPaymentCookie(cookies, tenant, reference)) {
    return true;
  }
  return isSameEmail(userEmail, payer);
}
