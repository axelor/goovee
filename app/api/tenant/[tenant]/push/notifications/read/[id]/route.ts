import {NextRequest, NextResponse} from 'next/server';
import {manager} from '@/tenant';
import {getSession} from '@/lib/core/auth';

export async function POST(
  request: NextRequest,
  props: {params: Promise<{tenant: string; id: string}>},
) {
  const params = await props.params;
  const {tenant: tenantId, id} = params;

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

  try {
    const existing = await client.pushNotification.findOne({
      where: {id, partner: {id: session.user.id}},
      select: {id: true, version: true},
    });

    if (!existing) {
      return new NextResponse('Not found', {status: 404});
    }

    await client.pushNotification.update({
      data: {
        id: existing.id,
        version: existing.version,
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({success: true});
  } catch (error: unknown) {
    console.error('Mark as read error:', error);
    if (error instanceof Error) {
      return NextResponse.json({error: error.message}, {status: 500});
    }
    return NextResponse.json({error: 'Unknown error'}, {status: 500});
  }
}
