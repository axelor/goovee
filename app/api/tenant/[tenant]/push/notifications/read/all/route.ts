import {NextRequest, NextResponse} from 'next/server';
import {manager} from '@/tenant';
import {getSession} from '@/lib/core/auth';

export async function POST(
  _request: NextRequest,
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

  try {
    await client.pushNotification.updateAll({
      set: {
        isRead: true,
        readAt: new Date(),
      },
      where: {
        partner: {id: session.user.id},
        isRead: false,
      },
    });

    return NextResponse.json({success: true});
  } catch (error: unknown) {
    console.error('Mark all as read error:', error);
    if (error instanceof Error) {
      return NextResponse.json({error: error.message}, {status: 500});
    }
    return NextResponse.json({error: 'Unknown error'}, {status: 500});
  }
}
