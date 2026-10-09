import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {getSession} from '@/auth';
import {
  MAX_DEVICE_BYTES,
  PushDeviceSchema,
  PushDeviceTokenSchema,
} from '@/mobile/types';
import {isMobileAppEnabled} from '@/mobile/enabled';
import {RequestBodyTooLarge, readTextWithin} from '@/security/request-body';
import {manager} from '@/tenant';

type Params = {params: Promise<{tenant: string}>};

/* The request body as JSON. Throws RequestBodyTooLarge or a SyntaxError. */
async function readJson(request: NextRequest): Promise<unknown> {
  return JSON.parse(await readTextWithin(request, MAX_DEVICE_BYTES));
}

/* The response refusing a body readJson could not read. */
function refuseBody(error: unknown, tenantId: string): NextResponse {
  if (error instanceof RequestBodyTooLarge) {
    console.error(
      `[PUSH] Refused a device over ${MAX_DEVICE_BYTES} bytes for tenant '${tenantId}'`,
    );
    return new NextResponse('Payload too large', {status: 413});
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({error: 'Invalid device'}, {status: 400});
  }
  throw error;
}

/*
 * Registers this device of the mobile app for the signed-in user. A token
 * already held for someone else moves to this user: notifications are routed
 * by user, so each only ever receives their own, and the device has changed
 * hands.
 */
export async function POST(request: NextRequest, props: Params) {
  const {tenant: tenantId} = await props.params;

  const session = await getSession();
  if (!session?.user) {
    return new NextResponse('Unauthorized', {status: 401});
  }
  if (session.user.tenantId !== tenantId) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return new NextResponse('Bad request', {status: 400});
  }
  /* A tenant that does not use the app takes no devices. Removing one stays
   * open below, so a device left from before can still be forgotten. */
  if (!isMobileAppEnabled(tenant.config.public)) {
    return new NextResponse('Not found', {status: 404});
  }
  const {client} = tenant;

  let json: unknown;
  try {
    json = await readJson(request);
  } catch (error) {
    return refuseBody(error, tenantId);
  }

  const result = PushDeviceSchema.safeParse(json);
  if (!result.success) {
    return NextResponse.json(
      {error: 'Invalid device', details: z.prettifyError(result.error)},
      {status: 400},
    );
  }
  const {token, platform} = result.data;

  try {
    const existing = await client.pushDevice.findOne({
      where: {token},
      select: {id: true, version: true},
    });
    const data = {
      token,
      platform,
      partner: {select: {id: session.user.id}},
      lastUsedAt: new Date(),
    };
    if (existing) {
      await client.pushDevice.update({
        data: {...data, id: existing.id, version: existing.version},
      });
    } else {
      await client.pushDevice.create({data});
    }
    return NextResponse.json({success: true});
  } catch (error: unknown) {
    console.error('[PUSH] Device registration error:', error);
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Unknown error'},
      {status: 500},
    );
  }
}

/*
 * Forgets a device. Holding its token is what permits it, as holding a browser
 * subscription permits unsubscribing it, so this also works once the session
 * has ended.
 */
export async function DELETE(request: NextRequest, props: Params) {
  const {tenant: tenantId} = await props.params;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return new NextResponse('Bad request', {status: 400});
  }
  const {client} = tenant;

  let json: unknown;
  try {
    json = await readJson(request);
  } catch (error) {
    return refuseBody(error, tenantId);
  }

  const result = PushDeviceTokenSchema.safeParse(json);
  if (!result.success) {
    return NextResponse.json(
      {error: 'Invalid device', details: z.prettifyError(result.error)},
      {status: 400},
    );
  }

  try {
    const existing = await client.pushDevice.findOne({
      where: {token: result.data.token},
      select: {id: true, version: true},
    });
    if (existing) {
      await client.pushDevice.delete({
        id: existing.id,
        version: existing.version,
      });
    }
    return NextResponse.json({success: true});
  } catch (error: unknown) {
    console.error('[PUSH] Device removal error:', error);
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Unknown error'},
      {status: 500},
    );
  }
}
