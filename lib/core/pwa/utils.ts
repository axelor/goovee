import type {ActionResponse} from '@/types/action';
import webpush, {WebPushError} from 'web-push';
import type {Client} from '@/goovee/.generated/client';
import {tenantConfigProvider} from '@/tenant/config-provider';
import type {TenantConfig} from '@/tenant';
import type {NotificationDTO, NotificationPayload} from './types';

async function sendNotification(
  subscription: webpush.PushSubscription,
  payload: NotificationPayload,
  config: TenantConfig | null,
): ActionResponse<true> {
  /* The subscription was created in the browser against the tenant's
   * publicEnv key, so signing must use the same tenant's key pair. */
  const publicKey = config?.publicEnv?.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = config?.webPush?.privateKey;
  const subject = config?.webPush?.subject;

  if (!publicKey || !privateKey || !subject) {
    return {error: true, message: 'Missing VAPID keys'};
  }

  if (!subject.startsWith('mailto:') && !subject.startsWith('https://')) {
    return {
      error: true,
      message: 'VAPID_SUBJECT must start with mailto: or https:',
    };
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      vapidDetails: {
        subject,
        publicKey,
        privateKey,
      },
    });
    return {success: true, data: true};
  } catch (error: unknown) {
    if (error instanceof WebPushError) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        // Subscription has expired or is no longer valid
        return {error: true, message: 'expired'};
      }
    }
    console.error('Error sending notification', error);
    if (error instanceof Error) {
      return {error: true, message: error.message};
    }
    return {error: true, message: 'unknown'};
  }
}

export async function notifyUser({
  userId,
  tenantId,
  workspaceURL,
  client,
  payload,
  getReplacementTitle,
}: {
  userId: string;
  tenantId: string;
  workspaceURL?: string;
  client: Client;
  payload: Omit<
    NotificationPayload,
    'tenantId' | 'workspaceURL' | 'notification'
  >;
  /**
   * When provided, called with the total unread count for this tag (including
   * the notification being created). Use this to produce grouped titles like
   * "You have 3 new comments on X" that replace previous push notifications
   * in the OS tray via the tag mechanism.
   */
  getReplacementTitle?: (count: number) => string | Promise<string>;
}) {
  if (!client) return;

  let unreadCount = 1; // +1 for the notification we are about to create
  if (getReplacementTitle && payload.tag) {
    try {
      unreadCount += Number(
        await client.pushNotification.count({
          where: {partner: {id: userId}, tag: payload.tag, isRead: false},
        }),
      );
    } catch {
      // non-fatal — fall back to singular title
    }
  }

  const pushTitle: string =
    getReplacementTitle && unreadCount > 1
      ? await getReplacementTitle(unreadCount)
      : payload.title;

  // 2. Store the notification in the database for history/unread count
  let dbNotification: NotificationDTO | undefined;
  try {
    dbNotification = await client.pushNotification.create({
      data: {
        partner: {select: {id: userId}},
        workspace: workspaceURL ? {select: {url: workspaceURL}} : undefined,
        title: payload.title,
        body: payload.body,
        url: payload.url,
        isRead: false,
        tag: payload.tag,
      },
      select: {
        id: true,
        title: true,
        body: true,
        url: true,
        createdOn: true,
        tag: true,
      },
    });
  } catch (error) {
    console.error('Failed to store notification record:', error);
  }

  // 3. Send the real-time push notification to all active devices
  try {
    const subscriptions = await client.pushSubscription.find({
      where: {partner: {id: userId}},
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
        version: true,
        expiresAt: true,
      },
    });

    if (!subscriptions?.length) return;

    const tenantConfig = await tenantConfigProvider.get(tenantId);

    const pushPayload: NotificationPayload = {
      ...payload,
      title: pushTitle,
      tenantId,
      workspaceURL,
      notification: dbNotification,
    };

    await Promise.all(
      subscriptions.map(async sub => {
        if (!sub.endpoint || !sub.p256dh || !sub.auth) return;

        if (sub.expiresAt && sub.expiresAt < new Date()) {
          await client.pushSubscription.delete({
            id: sub.id,
            version: sub.version,
          });
          return;
        }

        const result = await sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          pushPayload,
          tenantConfig,
        );

        if (result.error) {
          if (result.message === 'expired') {
            await client.pushSubscription.delete({
              id: sub.id,
              version: sub.version,
            });
          } else {
            console.error('Error sending notification:', {
              result,
              subId: sub.id,
              notificationId: pushPayload.notification?.id,
            });
          }
        }

        return result;
      }),
    );
  } catch (error) {
    console.error('Failed to send push notification:', {userId, error});
  }
}

export default webpush;
