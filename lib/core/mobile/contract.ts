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
  /* Forget the saved portal and return to the portal picker. */
  | {id: string; type: 'portal.switch'};

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
  | {id: string; type: 'error'; message: string};
