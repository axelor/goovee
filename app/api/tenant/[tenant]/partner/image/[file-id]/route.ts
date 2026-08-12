import {NextRequest, NextResponse} from 'next/server';
import {findFile, streamFile} from '@/utils/download';
import {manager} from '@/tenant';

export async function GET(
  request: NextRequest,
  props: {params: Promise<{tenant: string; 'file-id': string}>},
) {
  const params = await props.params;
  const {'file-id': fileId, tenant: tenantId} = params;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return new NextResponse('Bad request', {status: 400});
  }
  const {client} = tenant;
  //NOTE: No authentication required since partner images are public

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
    client: tenant.client,
    storage: tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile({...file, request});
}
