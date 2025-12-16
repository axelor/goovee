import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {getSession} from '@/lib/core/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {manager} from '@/tenant';
import {streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {fetchFile} from '@/subapps/resources/common/orm/dms';

export async function GET(
  request: NextRequest,
  {params}: {params: {tenant: string; workspace: string; 'file-id': string}},
) {
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {'file-id': fileId} = params;

  const session = await getSession();

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.resources,
    user: session?.user,
    url: workspaceURL,
    tenantId,
  });

  if (!subapp?.isInstalled) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const file = await fetchFile({
    id: fileId,
    tenantId,
    workspace,
    user: session?.user,
  });

  if (!file?.metaFile?.id) {
    return new NextResponse('File not found', {status: 404});
  }

  const tenant = await manager.getTenant(tenantId);
  const storage = tenant?.config?.aos?.storage;
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
