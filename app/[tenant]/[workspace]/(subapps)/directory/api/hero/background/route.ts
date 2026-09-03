import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessStatus} from '@/lib/core/access/denial';
import {findFile, streamFile} from '@/utils/download';

// ---- LOCAL IMPORTS ---- //
import {getDirectoryConfig} from '../../../common/orm/config';

export async function GET(request: NextRequest) {
  const access = await ensureAccess({
    code: SUBAPP_CODES.directory,
    allowGuest: true,
  });
  if (!access.ok) {
    return new NextResponse('Unauthorized', {
      status: accessStatus(access.reason),
    });
  }
  const {client} = access.tenant;

  const config = await getDirectoryConfig(access.workspace.config.id, client);

  const bgImageId = config?.directoryHeroBgImage?.id;

  if (!bgImageId) {
    return new NextResponse('Image not found', {status: 404});
  }

  const file = await findFile({
    id: bgImageId,
    meta: true,
    client: client,
    storage: access.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile({...file, request});
}
