import webpush, {WebPushError} from 'web-push';

export async function sendNotification(
  subscription: webpush.PushSubscription,
  payload: {title: string; body: string; url?: string},
) {
  const publicKey = process.env.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    return {success: false, error: 'Missing VAPID keys'};
  }

  if (!subject.startsWith('mailto:') && !subject.startsWith('https://')) {
    return {
      success: false,
      error: 'VAPID_SUBJECT must start with mailto: or https:',
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
    return {success: true};
  } catch (error: unknown) {
    console.error('Error sending notification', error);
    if (error instanceof WebPushError) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        // Subscription has expired or is no longer valid
        return {success: false, error: 'expired'};
      }
    }
    if (error instanceof Error) {
      return {success: false, error: error.message};
    }
    return {success: false, error: 'unknown'};
  }
}

export default webpush;
