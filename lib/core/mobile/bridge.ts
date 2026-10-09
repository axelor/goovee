import {
  MOBILE_BRIDGE_GLOBAL,
  MOBILE_PROTOCOL_VERSION,
  MOBILE_REPLY_EVENT,
  type MobileBridge,
  type MobileReply,
  type MobileRequest,
} from './contract';

/* Long enough for the user to answer a permission prompt. */
const REPLY_TIMEOUT_MS = 5 * 60 * 1000;

/*
 * The mobile app's bridge when this page runs inside the app, otherwise null.
 * The app defines it as the page starts loading, so it is read from effects and
 * event handlers, never while rendering on the server. Null as well for an app
 * speaking another protocol version, whose page then behaves as on the web.
 */
export function getMobileBridge(): MobileBridge | null {
  if (typeof window === 'undefined') return null;
  const bridge: unknown = Reflect.get(window, MOBILE_BRIDGE_GLOBAL);
  if (typeof bridge !== 'object' || bridge === null) return null;
  return (bridge as MobileBridge).protocolVersion === MOBILE_PROTOCOL_VERSION
    ? (bridge as MobileBridge)
    : null;
}

type RequestWithoutId = MobileRequest extends infer Request
  ? Request extends MobileRequest
    ? Omit<Request, 'id'>
    : never
  : never;

/*
 * Sends a request to the app and resolves with its reply. Rejects when the app
 * does not answer in time, which also covers an app too old to know the
 * request.
 */
export function requestApp(
  bridge: MobileBridge,
  request: RequestWithoutId,
): Promise<MobileReply> {
  const id = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener(MOBILE_REPLY_EVENT, onReply);
      reject(new Error(`The app did not answer ${request.type}`));
    }, REPLY_TIMEOUT_MS);

    function onReply(event: Event) {
      const reply = (event as MessageEvent<MobileReply>).data;
      if (reply?.id !== id) return;
      window.clearTimeout(timeout);
      window.removeEventListener(MOBILE_REPLY_EVENT, onReply);
      resolve(reply);
    }

    window.addEventListener(MOBILE_REPLY_EVENT, onReply);
    bridge.send({...request, id} as MobileRequest);
  });
}
