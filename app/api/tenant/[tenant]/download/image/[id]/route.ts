import {NextRequest, NextResponse} from 'next/server';
import {findFile, streamFile} from '../../utils';

export async function GET(
  request: NextRequest,
  {params}: {params: {tenant: string; id: string}},
) {
  return new NextResponse('Forbidden', {status: 403});
  const {id, tenant} = params;

  const file = await findFile({
    id,
    meta: true,
    tenant,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
