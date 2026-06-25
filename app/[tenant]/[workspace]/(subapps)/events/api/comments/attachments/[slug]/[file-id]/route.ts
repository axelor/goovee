import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {isFileOfRecord} from '@/comments/orm';
import {isCommentEnabled} from '@/comments';
import {SUBAPP_CODES} from '@/constants';
import {accessStatus} from '@/lib/core/access/denial';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getWorkspaceConfig} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {findEvent} from '../../../../../common/orm/event';

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

  const access = await ensureAuth({
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

  /* WorkspaceLight carries config as {id} only; fetch the heavy config and
     bridge it so the shared isCommentEnabled helper can read the comment flags. */
  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) {
    return new NextResponse('Forbidden', {status: 403});
  }
  const workspace = {...access.workspace, config};

  if (
    !isCommentEnabled({subapp: SUBAPP_CODES.events, config: workspace.config})
  ) {
    return new NextResponse('Forbidden', {status: 403});
  }

  const event = await findEvent({
    slug,
    workspaceURL,
    client,
    config: access.tenant.config,
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
