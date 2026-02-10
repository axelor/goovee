import type {ActionResponse} from '@/types/action';
import webpush, {WebPushError} from 'web-push';
import {manager} from '@/tenant';

export async function sendNotification(
  subscription: webpush.PushSubscription,
  payload: {title: string; body?: string; url?: string},
): ActionResponse<true> {
  const publicKey = process.env.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

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

export async function sendToPartner({
  partnerId,
  tenantId,
  workspaceId,
  payload,
  related,
}: {
  partnerId: string | number;
  tenantId: string;
  workspaceId?: string | number;
  payload: {title: string; body?: string; url?: string};
  related?: {id: string | number; model: string; type?: string};
}) {
  const client = await manager.getClient(tenantId);
  if (!client) return;

  // 1. Store the notification in the database for history/unread count
  let dbNotification;
  try {
    dbNotification = await client.pushNotification.create({
      data: {
        partner: {select: {id: partnerId}},
        workspace: workspaceId ? {select: {id: workspaceId}} : undefined,
        title: payload.title,
        body: payload.body,
        url: payload.url,
        isRead: false,
        typeSelect: related?.type,
        relatedId: related?.id?.toString(),
        relatedModel: related?.model,
      },
      select: {id: true},
    });
  } catch (error) {
    console.error('Failed to store notification record:', error);
  }

  // 2. Send the real-time push notification to all active devices
  const subscriptions = await client.pushSubscription.find({
    where: {partner: {id: partnerId}},
    select: {id: true, endpoint: true, p256dh: true, auth: true, version: true},
  });

  if (!subscriptions?.length) return;

  const pushPayload = {
    ...payload,
    notificationId: dbNotification?.id,
    tenantId,
    workspaceId,
  };

  for (const sub of subscriptions) {
    if (!sub.endpoint || !sub.p256dh || !sub.auth) continue;

    const result = await sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      },
      pushPayload,
    );

    if (result.error && result.message === 'expired') {
      console.log(`Cleaning up expired subscription: ${sub.endpoint}`);
      await client.pushSubscription.delete({
        id: sub.id,
        version: sub.version,
      });
    }
  }
}

export default webpush;
