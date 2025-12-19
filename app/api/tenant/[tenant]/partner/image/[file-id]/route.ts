import {NextRequest, NextResponse} from 'next/server';
import {findFile, streamFile} from '@/utils/download';
import {manager} from '@/tenant';

export async function GET(
  request: NextRequest,
  props: {params: Promise<{tenant: string; 'file-id': string}>}
) {
  const params = await props.params;
  const {'file-id': fileId, tenant} = params;

  const client = await manager.getClient(tenant);

  if (!client) {
    return new NextResponse('Bad request', {status: 400});
  }

  const partner = await client.aOSPartner.findOne({
    where: {picture: {id: fileId}},
    select: {picture: {id: true}},
  });

  if (!partner?.picture?.id) {
    return new NextResponse('Picture not found', {status: 404});
  }

  const file = await findFile({
    id: partner.picture.id,
    meta: true,
    tenant,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
