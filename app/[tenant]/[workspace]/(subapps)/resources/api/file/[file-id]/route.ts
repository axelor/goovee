import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessStatus} from '@/lib/core/access/denial';
import {streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {fetchFile} from '@/subapps/resources/common/orm/dms';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{tenant: string; workspace: string; 'file-id': string}>;
  },
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {'file-id': fileId} = params;

  const access = await ensureAuth({
    code: SUBAPP_CODES.resources,
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
  const storage = access.tenant.config.aos.storage;

  const file = await fetchFile({
    id: fileId,
    client,
    workspaceURL,
    user: access.user,
  });

  if (!file?.metaFile?.id) {
    return new NextResponse('File not found', {status: 404});
  }
  if (!storage) {
    return new NextResponse('Bad config', {status: 500});
  }

  const filePath = `${storage}/${file.metaFile.filePath}`;
  const fileName = file.metaFile.fileName!;
  const fileType = file.metaFile.fileType!;

  return streamFile({
    fileName,
    filePath,
    fileType,
  });
}
