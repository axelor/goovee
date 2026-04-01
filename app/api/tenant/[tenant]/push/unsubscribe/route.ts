import {NextRequest, NextResponse} from 'next/server';
import {manager} from '@/tenant';
import {treeifyError} from 'zod';
import {PushSubscriptionSchema} from '@/lib/core/pwa/types';

export async function POST(
  request: NextRequest,
  props: {params: Promise<{tenant: string}>},
) {
  const params = await props.params;
  const {tenant} = params;

  const client = await manager.getClient(tenant);
  if (!client) {
    return new NextResponse('Bad request', {status: 400});
  }

  const json = await request.json();
  const result = PushSubscriptionSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      {error: 'Invalid request', details: treeifyError(result.error)},
      {status: 400},
    );
  }

  const {endpoint, keys} = result.data;

  try {
    const existing = await client.pushSubscription.findOne({
      where: {endpoint, p256dh: keys.p256dh, auth: keys.auth},
      select: {id: true, version: true},
    });

    if (existing) {
      await client.pushSubscription.delete({
        id: existing.id,
        version: existing.version,
      });
    }

    return NextResponse.json({success: true});
  } catch (error: unknown) {
    console.error('Push unsubscribe error:', error);
    if (error instanceof Error) {
      return NextResponse.json({error: error.message}, {status: 500});
    }
    return NextResponse.json({error: 'Unknown error'}, {status: 500});
  }
}
