import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessStatus} from '@/lib/core/access/denial';
import {findFile, streamFile} from '@/utils/download';

// ---- LOCAL IMPORTS ---- //
import {findEventImage} from '@/subapps/events/common/orm/event';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      slug: string;
    }>;
  },
) {
  const params = await props.params;
  const {slug} = params;

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    allowGuest: true,
  });
  if (!access.ok) {
    return new NextResponse('Unauthorized', {
      status: accessStatus(access.reason),
    });
  }
  const {client} = access.tenant;

  const workspaceURL = access.workspace.url;

  const event = await findEventImage({
    slug,
    workspaceURL,
    client,
    user: access.user,
  });

  if (!event?.eventImage?.id) {
    return new NextResponse('Image not found', {status: 404});
  }

  const file = await findFile({
    id: event.eventImage.id,
    meta: true,
    client,
    storage: access.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile({...file, request});
}
