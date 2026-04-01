import {NextRequest, NextResponse} from 'next/server';
import {manager} from '@/tenant';
import {getSession} from '@/lib/core/auth';
import {treeifyError} from 'zod';
import {PushSubscriptionSchema} from '@/pwa/types';

export async function POST(
  request: NextRequest,
  props: {params: Promise<{tenant: string}>},
) {
  const params = await props.params;
  const {tenant} = params;

  const session = await getSession();
  if (!session?.user) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const client = await manager.getClient(tenant);
  if (!client) {
    return new NextResponse('Bad request', {status: 400});
  }

  const json = await request.json();
  const result = PushSubscriptionSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      {error: 'Invalid subscription', details: treeifyError(result.error)},
      {status: 400},
    );
  }

  const subscription = result.data;

  try {
    const existing = await client.pushSubscription.findOne({
      where: {endpoint: subscription.endpoint},
      select: {id: true, version: true},
    });

    const data = {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh,
      auth: subscription.keys?.auth,
      partner: {select: {id: session.user.id}},
      lastUsedAt: new Date(),
      expiresAt: subscription.expirationTime
        ? new Date(subscription.expirationTime)
        : null,
    };

    if (existing) {
      // Intentionally reassign if the endpoint belongs to a different user —
      // notifications are routed by partner ID, so each user only ever receives
      // their own. Reassignment just means this device/browser switched hands.
      await client.pushSubscription.update({
        data: {
          ...data,
          id: existing.id,
          version: existing.version,
        },
      });
    } else {
      await client.pushSubscription.create({
        data,
      });
    }

    return NextResponse.json({success: true});
  } catch (error: unknown) {
    console.error('Push subscription error:', error);
    if (error instanceof Error) {
      return NextResponse.json({error: error.message}, {status: 500});
    }
    return NextResponse.json({error: 'Unknown error'}, {status: 500});
  }
}
