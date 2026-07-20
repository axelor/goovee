import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {isFileOfRecord} from '@/comments/orm';
import {isCommentEnabled} from '@/comments';
import {SUBAPP_CODES} from '@/constants';
import {accessStatus} from '@/lib/core/access/denial';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {getEventsConfig} from '@/subapps/events/common/orm/config';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {findEventIdForAccess} from '../../../../../common/orm/event';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      slug: string;
      'file-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {slug, 'file-id': fileId} = params;

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });
  if (!access.ok) {
    return new NextResponse('Unauthorized', {
      status: accessStatus(access.reason),
    });
  }
  const {client} = access.tenant;

  /* Workspace carries config as {id} only; fetch the heavy config so the
     shared isCommentEnabled helper can read the comment flags. */
  const config = await getEventsConfig(access.workspace.config.id, client);
  if (!config) {
    return new NextResponse('Forbidden', {status: 403});
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.events, config})) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const event = await findEventIdForAccess({
    slug,
    workspaceURL,
    client,
    user: access.user,
  });
  if (!event) {
    return new NextResponse('Forbidden', {status: 403});
  }

  if (!(await isFileOfRecord({recordId: event.id, fileId, client}))) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const file = await findFile({
    id: fileId,
    meta: true,
    client,
    storage: access.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
