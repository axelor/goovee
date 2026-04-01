import {NextRequest, NextResponse} from 'next/server';
import {manager} from '@/tenant';
import {getSession} from '@/lib/core/auth';

export async function POST(
  _request: NextRequest,
  props: {params: Promise<{tenant: string; tag: string}>},
) {
  const params = await props.params;
  const {tenant, tag} = params;

  const session = await getSession();
  if (!session?.user) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const client = await manager.getClient(tenant);
  if (!client) {
    return new NextResponse('Bad request', {status: 400});
  }

  try {
    const updated = await client.pushNotification.updateAll({
      set: {isRead: true, readAt: new Date()},
      where: {tag, partner: {id: session.user.id}, isRead: false},
    });

    return NextResponse.json({success: true, updated});
  } catch (error: unknown) {
    console.error('Mark as read by tag error:', error);
    if (error instanceof Error) {
      return NextResponse.json({error: error.message}, {status: 500});
    }
    return NextResponse.json({error: 'Unknown error'}, {status: 500});
  }
}
