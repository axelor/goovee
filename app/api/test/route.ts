import {NextResponse} from 'next/server';
import {sendToPartner} from '@/utils/push';
import {DEFAULT_TENANT} from '@/constants';

export async function GET() {
  try {
    const partnerId = 1;
    const tenantId = DEFAULT_TENANT;
    const workspaceId = 1;

    await sendToPartner({
      partnerId,
      tenantId,
      workspaceId,
      payload: {
        title: 'Test Notification',
        body: 'This is a test notification from the /api/test endpoint.',
        url: '/d/india/notifications',
      },
      related: {
        id: 'test-1',
        model: 'TestModel',
        type: 'test',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Notification sent to partner ${partnerId} in tenant ${tenantId}`,
      workspaceId,
    });
  } catch (error: unknown) {
    console.error('Test endpoint error:', error);
    if (error instanceof Error) {
      return NextResponse.json({error: error.message}, {status: 500});
    }
    return NextResponse.json({error: 'Unknown error'}, {status: 500});
  }
}
