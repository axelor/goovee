import {NextRequest, NextResponse} from 'next/server';
import {findFile, streamFile} from '@/utils/download';
import {manager} from '@/tenant';
import {filterPrivate} from '@/orm/filter';
import {getSession} from '@/lib/core/auth';
import {and} from '@/utils/orm';
import type {AOSProduct} from '@/goovee/.generated/models';
import {findModelFields} from '@/orm/model-fields';

import {
  BASE_PRODUCT_MODEL,
  PRODUCT_ATTRS,
} from '@/subapps/shop/common/constants';
import {isRelationalType} from '@/subapps/shop/common/utils';

export async function GET(
  request: NextRequest,
  {params}: {params: {tenant: string; 'product-id': string; 'file-id': string}},
) {
  const {'product-id': productId, 'file-id': fileId, tenant} = params;

  const client = await manager.getClient(tenant);

  const session = await getSession();
  const user = session?.user;

  if (!client) {
    return new NextResponse('Bad request', {status: 400});
  }

  const metaFields = await findModelFields({
    modelName: BASE_PRODUCT_MODEL,
    modelField: PRODUCT_ATTRS,
    tenantId: tenant,
  });

  const relationalFields = metaFields.filter(field =>
    isRelationalType(field.type),
  );

  const product = await client.aOSProduct.findOne({
    where: {
      ...and<AOSProduct>([
        await filterPrivate({tenantId: tenant, user}),
        {id: productId},
      ]),
    },
    select: {
      productAttrs: true,
    },
  });

  const attrs = product?.productAttrs as unknown as Record<string, any> | null;

  if (!attrs) return new NextResponse('File not found', {status: 404});

  const fileBelongsToProduct = relationalFields.some(field => {
    const value = attrs[field.name as any];
    const values: any[] = Array.isArray(value) ? value : [value];

    return values.some(
      (value: any) =>
        value &&
        value.id &&
        String(value.id) === fileId &&
        value.fileName &&
        value.fileType &&
        value.fileSize &&
        value.filePath,
    );
  });

  if (!fileBelongsToProduct) {
    return new NextResponse('File not found', {status: 404});
  }

  const file = await findFile({
    id: fileId,
    meta: true,
    tenant,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
