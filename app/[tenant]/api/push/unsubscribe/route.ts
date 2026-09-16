import {NextRequest, NextResponse} from 'next/server';
import {manager} from '@/tenant';
import {treeifyError} from 'zod';
import {MAX_SUBSCRIPTION_BYTES, PushSubscriptionSchema} from '@/pwa/types';
import {RequestBodyTooLarge, readTextWithin} from '@/security/request-body';

export async function POST(
  request: NextRequest,
  props: {params: Promise<{tenant: string}>},
) {
  const params = await props.params;
  const {tenant: tenantId} = params;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return new NextResponse('Bad request', {status: 400});
  }
  const {client} = tenant;

  let body: string;
  try {
    body = await readTextWithin(request, MAX_SUBSCRIPTION_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLarge) {
      console.error(
        `[PUSH] Refused a subscription over ${MAX_SUBSCRIPTION_BYTES} bytes for tenant '${tenantId}'`,
      );

      return new NextResponse('Payload too large', {status: 413});
    }
    throw error;
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return NextResponse.json({error: 'Invalid request'}, {status: 400});
  }

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
