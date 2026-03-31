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
    const unread = await client.pushNotification.find({
      where: {tag, partner: {id: session.user.id}, isRead: false},
      select: {id: true, version: true},
    });

    if (!unread.length) {
      return NextResponse.json({success: true, updated: 0});
    }

    await Promise.all(
      unread.map(n =>
        client.pushNotification.update({
          data: {
            id: n.id,
            version: n.version,
            isRead: true,
            readAt: new Date(),
          },
        }),
      ),
    );

    return NextResponse.json({success: true, updated: unread.length});
  } catch (error: unknown) {
    console.error('Mark as read by tag error:', error);
    if (error instanceof Error) {
      return NextResponse.json({error: error.message}, {status: 500});
    }
    return NextResponse.json({error: 'Unknown error'}, {status: 500});
  }
}
