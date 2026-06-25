import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessStatus} from '@/lib/core/access/denial';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {findGroupById} from '@/subapps/forum/common/orm/forum';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{tenant: string; workspace: string; 'group-id': string}>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {'group-id': groupId} = params;

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });
  if (!access.ok) {
    return new NextResponse('Unauthorized', {
      status: accessStatus(access.reason),
    });
  }
  const {client} = access;

  const group = await findGroupById(
    groupId,
    String(access.workspace.id),
    client,
    access.user,
  );

  if (!group?.image?.id) {
    return new NextResponse('Image not found', {status: 404});
  }

  const imageId = group.thumbnailImage?.id || group.image?.id;
  const file = await findFile({
    id: imageId,
    meta: true,
    client,
    storage: access.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
