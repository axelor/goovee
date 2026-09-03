import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessStatus} from '@/lib/core/access/denial';
import {resolveStoragePath} from '@/storage/index';
import {streamFile} from '@/utils/download';

// ---- LOCAL IMPORTS ---- //
import {fetchFile} from '@/subapps/resources/common/orm/dms';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{tenant: string; workspace: string; 'file-id': string}>;
  },
) {
  const params = await props.params;
  const {'file-id': fileId} = params;

  const access = await ensureAccess({
    code: SUBAPP_CODES.resources,
    allowGuest: true,
  });
  if (!access.ok) {
    return new NextResponse('Unauthorized', {
      status: accessStatus(access.reason),
    });
  }
  const {client} = access.tenant;
  const storage = access.tenant.config.aos.storage;

  const workspaceURL = access.workspace.url;

  const file = await fetchFile({
    id: fileId,
    client,
    workspaceURL,
    user: access.user,
  });

  if (!file?.metaFile?.id || !file.metaFile.filePath) {
    return new NextResponse('File not found', {status: 404});
  }
  if (!storage) {
    return new NextResponse('Bad config', {status: 500});
  }

  const filePath = resolveStoragePath(storage, file.metaFile.filePath);

  if (!filePath) {
    console.error(
      `Meta file ${file.metaFile.id} records a path outside the storage directory.`,
    );
    return new NextResponse('File not found', {status: 404});
  }

  const fileName = file.metaFile.fileName!;
  const fileType = file.metaFile.fileType!;

  return streamFile({
    fileName,
    filePath,
    fileType,
    request,
  });
}
