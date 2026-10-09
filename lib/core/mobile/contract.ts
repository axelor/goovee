/*
 * The messages exchanged between a portal page and the portal mobile app it runs
 * in. The app keeps a word-for-word copy of this file, so it has no imports.
 *
 * The app and the portal are updated independently: a portal meets apps older
 * and newer than itself. Changes are therefore additive only. A new message type
 * may be added; an existing one never changes shape or meaning. A change that
 * cannot be additive raises MOBILE_PROTOCOL_VERSION.
 */

export const MOBILE_PROTOCOL_VERSION = 1;

/*
 * The app appends `PortalApp/<app version>` to the WebView's user agent, so the
 * server can tell a request comes from the app before any page script runs.
 */
export const MOBILE_USER_AGENT_PRODUCT = 'PortalApp';

/*
 * The global the app defines in every portal page as the page starts loading.
 * On Android it can arrive after scripts inlined in the page's head, so a page
 * tells it is in the app from the user agent and reads this global only from
 * scripts that run once the document is parsed.
 */
export const MOBILE_BRIDGE_GLOBAL = 'PortalApp';

/* The window event the app's replies arrive as; the reply is `event.data`. */
export const MOBILE_REPLY_EVENT = 'portal-app';

export type MobilePlatform = 'android' | 'ios';

/*
 * Below a portal's address, the path the app asks before opening it. A portal
 * answers with MobilePortalStatus as JSON; an address with nothing there is not
 * a portal the app can open.
 */
export const MOBILE_PORTAL_STATUS_PATH = '/api/mobile/status';

/*
 * Below a portal's address, where devices are registered for notifications.
 * POST `{token, platform}` registers this device for the signed-in user; DELETE
 * `{token}` forgets it and needs no session, so the app can call it itself when
 * the user removes the portal.
 */
export const MOBILE_DEVICES_PATH = '/api/mobile/devices';

export type MobilePortalStatus = {
  /* Whether this portal can be used in the app. */
  enabled: boolean;
  /* The portal's MOBILE_PROTOCOL_VERSION. */
  protocolVersion: number;
};

/*
 * Signing in through an identity provider happens in the phone's browser, which
 * then hands the session to the app. The browser does so by redirecting here,
 * the app's own address, with a `token` and an `exchange` parameter naming the
 * portal address that completes the sign-in. From a page of the portal in its
 * WebView, the app posts `{token, verifier}` there as JSON, and goes on to the
 * `callbackURL` the answer names. The portal only ever redirects to this fixed
 * address, never one a request names.
 */
export const MOBILE_AUTH_RETURN_URL = 'com.axelor.portal://auth';

/*
 * The query parameter that marks a portal sign-in page opened by the app in the
 * phone's browser. Its value is the SHA-256 hash, base64url, of a secret only
 * the app holds; the app proves the sign-in is its own by posting the secret,
 * as `verifier`, with the token to the exchange address.
 */
export const MOBILE_HANDOVER_PARAM = 'app_handover';

/*
 * What the bridge global looks like to a page.
 */
export type MobileBridge = {
  platform: MobilePlatform;
  appVersion: string;
  protocolVersion: number;
  send: (request: MobileRequest) => void;
};

/*
 * Page → app. `id` is chosen by the page and comes back on the reply, so a page
 * can tell replies to concurrent requests apart.
 */
export type MobileRequest =
  /* Ask for notification permission and return this device's push token. */
  | {id: string; type: 'push.register'}
  /* Report the notification permission without asking for it. */
  | {id: string; type: 'push.status'}
  /* Show the user's portals, to open, add or remove one. */
  | {id: string; type: 'portal.switch'}
  /*
   * Open a sign-in page of this portal (`url`, absolute) in the phone's
   * browser, marked with MOBILE_HANDOVER_PARAM. On success the app completes
   * the exchange and the page moves on, so no reply comes; otherwise the reply
   * is `auth.cancelled` or `error`.
   */
  | {id: string; type: 'auth.open'; url: string};

/*
 * App → page, in reply to the request with the same `id`.
 */
export type MobileReply =
  | {
      id: string;
      type: 'push.token';
      platform: MobilePlatform;
      token: string;
    }
  | {id: string; type: 'push.denied'}
  | {
      id: string;
      type: 'push.status';
      permission: 'granted' | 'denied' | 'undetermined';
    }
  | {id: string; type: 'auth.cancelled'}
  | {id: string; type: 'error'; message: string};
