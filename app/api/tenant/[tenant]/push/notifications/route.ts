import {NextRequest, NextResponse} from 'next/server';
import {manager} from '@/tenant';
import {getSession} from '@/lib/core/auth';
import {fromStoredLink} from '@/lib/core/url/persisted-link';
import {NotificationDTO} from '@/lib/core/pwa/types';

export async function GET(
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

    /* Stored as route-tree paths; rendered here as the paths the visitor's
     * address bar holds, per the tenant's routing of this moment. */
    const rendered = notifications.map(notification => ({
      ...notification,
      url: notification.url
        ? fromStoredLink(notification.url, tenantId)
        : notification.url,
    }));

    return NextResponse.json(rendered);
  } catch (error: unknown) {
    console.error('Fetch notifications error:', error);
    if (error instanceof Error) {
      return NextResponse.json({error: error.message}, {status: 500});
    }
    return NextResponse.json({error: 'Unknown error'}, {status: 500});
  }
}
