import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';
import {NextRequest, NextResponse} from 'next/server';
import {ensureAuth} from '../../../common/utils/auth-helper';

export async function GET(
  request: NextRequest,
  {params}: {params: {tenant: string; workspace: string}},
) {
  const {workspaceURL, tenant} = workspacePathname(params);

  const {error, message, info} = await ensureAuth(workspaceURL, tenant);
  if (error) {
    return NextResponse.json({message}, {status: 401});
  }

  const {workspace} = info;
  const bgImageId = workspace.config.ticketHeroBgImage?.id;

  if (!bgImageId) {
    return new NextResponse('No ticket hero image found', {status: 404});
  }

  const file = await findFile({
    id: bgImageId,
    meta: true,
    tenant,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
