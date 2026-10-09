import fs from 'node:fs';
import path from 'node:path';

import {cert, initializeApp, type App} from 'firebase-admin/app';
import {getMessaging, type Message} from 'firebase-admin/messaging';

import type {PushDeliveryReport} from '@/pwa/types';
import {processWide} from '@/runtime/process-wide';
import {getDeploymentConfig} from '@/tenant/config';

const FIREBASE_APP = 'mobile/firebase-app';

/*
 * FCM's own codes for a token that no longer reaches a device: the app was
 * uninstalled, its data cleared, or it invalidated the token itself.
 * `mismatched-credential` is not among them: FCM also gives it when this
 * deployment's key may not send at all, and forgetting every device then would
 * hide the mistake and keep phones silent after it is fixed.
 */
const GONE_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

export type DeviceOutcome = keyof PushDeliveryReport;

export type DevicePush = {
  title: string;
  body?: string;
  /* The absolute address of the page the notification opens. The app opens it
   * only when it belongs to the portal the app shows. */
  url: string;
  tag?: string;
};

/*
 * One Firebase app for the process, signed with the deployment's service
 * account. Null when the deployment sets none: the mobile app then receives no
 * notifications.
 */
function getFirebaseApp(): App | null {
  const keyFile = getDeploymentConfig().push?.fcm?.serviceAccountFile;
  if (!keyFile) return null;
  return processWide(FIREBASE_APP, () =>
    initializeApp(
      {
        credential: cert(
          JSON.parse(fs.readFileSync(path.resolve(keyFile), 'utf8')),
        ),
      },
      FIREBASE_APP,
    ),
  );
}

export function isDevicePushEnabled(): boolean {
  return Boolean(getDeploymentConfig().push?.fcm?.serviceAccountFile);
}

function toMessage(token: string, push: DevicePush): Message {
  return {
    token,
    notification: {title: push.title, body: push.body},
    data: {url: push.url},
    android: {
      priority: 'high',
      /* Notifications sharing a tag replace each other in the tray, as they do
       * in the browser. */
      notification: push.tag ? {tag: push.tag} : undefined,
    },
    apns: push.tag ? {headers: {'apns-collapse-id': push.tag}} : undefined,
  };
}

/*
 * Sends one notification to each token, returning an outcome per token in the
 * same order. FCM queues and retries delivery itself, so a token it accepted is
 * sent; one it reports gone is expired, and the caller forgets it.
 */
export async function sendToDevices(
  tokens: string[],
  push: DevicePush,
): Promise<DeviceOutcome[]> {
  const app = getFirebaseApp();
  if (!app || !tokens.length) return tokens.map(() => 'failed');

  const response = await getMessaging(app).sendEach(
    tokens.map(token => toMessage(token, push)),
  );

  return response.responses.map((result, index) => {
    if (result.success) return 'sent';
    const code = result.error?.code;
    if (code && GONE_CODES.has(code)) return 'expired';
    console.error(
      `[PUSH] device ${tokens[index].slice(0, 12)}… could not be sent to`,
      result.error,
    );
    return 'failed';
  });
}
