import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {manager} from '@/tenant';
import {getSession} from '@/lib/core/auth';
import {PushSubscriptionSchema} from '@/pwa/types';

export async function POST(
  request: NextRequest,
  props: {params: Promise<{tenant: string}>},
) {
  const params = await props.params;
  const {tenant: tenantId} = params;

  const session = await getSession();
  if (!session?.user) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  // Guard cross-tenant access: /api/* bypasses the proxy that switches sessions.
  if (session.user.tenantId !== tenantId) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return new NextResponse('Bad request', {status: 400});
  }
  const {client} = tenant;

  const json = await request.json();
  const result = PushSubscriptionSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      {error: 'Invalid subscription', details: z.prettifyError(result.error)},
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
