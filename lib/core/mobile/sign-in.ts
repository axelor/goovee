import type {PublicConfig} from '@/tenant/types';
import type {TenantScope} from '@/url/tenant-urls';

import {requestApp} from './bridge';
import {MOBILE_HANDOVER_PARAM, type MobileBridge} from './contract';
import {isMobileAppEnabled} from './enabled';

const CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/*
 * The challenge on a sign-in page the mobile app opened in the phone's browser,
 * or null on any other page, and on every page of a tenant that does not use
 * the app.
 */
export function handoverChallenge(
  searchParams: {get: (name: string) => string | null},
  publicConfig: PublicConfig | null | undefined,
): string | null {
  if (!isMobileAppEnabled(publicConfig)) return null;
  const challenge = searchParams.get(MOBILE_HANDOVER_PARAM);
  return challenge && CHALLENGE_PATTERN.test(challenge) ? challenge : null;
}

/*
 * Where a sign-in continues to. On a page the app opened in the phone's browser
 * it goes through the handover, which takes the new session back to the app and
 * then to `redirection` there; anywhere else it goes to `redirection` directly.
 * `origin` is this portal's; in a browser it is the page's own.
 */
export function signInDestination(
  scope: TenantScope,
  challenge: string | null,
  redirection: string,
  origin: string = window.location.origin,
): string {
  if (!challenge) return redirection;
  /* The handover continues only to a path on this portal, so an address of
   * this portal given in full is reduced to its path. */
  const target = new URL(redirection, origin);
  const callbackURL =
    target.origin === origin
      ? `${target.pathname}${target.search}${target.hash}`
      : scope.forBrowser('/');
  const query = new URLSearchParams({challenge, callbackURL});
  return `${scope.forBrowser('/api/auth/mobile/handover/finish')}?${query}`;
}

/*
 * Asks the app to run a sign-in page of this portal in the phone's browser,
 * where identity providers allow signing in. `path` is the page, on this
 * portal; the app marks it as its own and completes the sign-in when the
 * browser hands it back, moving this page on. `onFailure` is called when the
 * sign-in could not be completed; a sign-in the user cancelled is not a
 * failure.
 */
export function signInThroughBrowser(
  bridge: MobileBridge,
  path: string,
  onFailure: () => void,
) {
  requestApp(bridge, {
    type: 'auth.open',
    url: new URL(path, window.location.origin).toString(),
  }).then(
    reply => {
      if (reply.type === 'error') onFailure();
    },
    /* No answer in time: the app is still waiting on the browser, or too old
     * to know the request. */
    () => onFailure(),
  );
}
