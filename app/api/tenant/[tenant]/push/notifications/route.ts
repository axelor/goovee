import {NextRequest, NextResponse} from 'next/server';
import {manager} from '@/tenant';
import {getSession} from '@/lib/core/auth';
import {NotificationDTO} from '@/lib/core/pwa/types';

export async function GET(
  _request: NextRequest,
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

  try {
    const notifications: NotificationDTO[] = await client.pushNotification.find(
      {
        where: {
          partner: {id: session.user.id},
          isRead: false,
        },
        select: {
          id: true,
          title: true,
          body: true,
          url: true,
          createdOn: true,
          tag: true,
        },
        orderBy: {createdOn: 'DESC'},
      },
    );

    return NextResponse.json(notifications);
  } catch (error: unknown) {
    console.error('Fetch notifications error:', error);
    if (error instanceof Error) {
      return NextResponse.json({error: error.message}, {status: 500});
    }
    return NextResponse.json({error: 'Unknown error'}, {status: 500});
  }
}
