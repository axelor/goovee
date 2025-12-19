import {NextRequest, NextResponse} from 'next/server';
import {findFile, streamFile} from '@/utils/download';
import {manager} from '@/tenant';
import {filterPrivate} from '@/orm/filter';
import {getSession} from '@/lib/core/auth';
import {and} from '@/utils/orm';
import type {AOSProduct} from '@/goovee/.generated/models';

export async function GET(
  request: NextRequest,
  props: {params: Promise<{tenant: string; id: string}>}
) {
  const params = await props.params;
  const {id, tenant} = params;

  const client = await manager.getClient(tenant);

  const session = await getSession();
  const user = session?.user;

  if (!client || !id) {
    return new NextResponse('Bad request', {status: 400});
  }

  const product = await client.aOSProduct.findOne({
    where: {
      ...and<AOSProduct>([
        await filterPrivate({tenantId: tenant, user}),
        {
          OR: [
            {picture: {id}},
            {thumbnailImage: {id}},
            {portalImageList: {picture: {id}}},
          ],
        },
      ]),
    },
    select: {
      picture: {id: true},
      thumbnailImage: {id: true},
      portalImageList: {
        where: {picture: {id}},
        select: {picture: {id: true}},
      } as {select: {picture: {id: true}}},
    },
  });

  if (
    id === product?.picture?.id ||
    product?.portalImageList?.some((i: any) => i?.picture?.id === id) ||
    id === product?.thumbnailImage?.id
  ) {
    const file = await findFile({
      id,
      meta: true,
      tenant,
    });

    if (!file) {
      return new NextResponse('File not found', {status: 404});
    }

    return streamFile(file);
  } else {
    return new NextResponse('Picture not found', {status: 404});
  }
}
