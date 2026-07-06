import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {findFile, streamFile} from '@/utils/download';
import {filterPrivate} from '@/orm/filter';
import {and} from '@/utils/orm';
import type {AOSProduct} from '@/goovee/.generated/models';
import {findModelFields} from '@/orm/model-fields';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessStatus} from '@/lib/core/access/denial';

// ---- LOCAL IMPORTS ---- //
import {
  BASE_PRODUCT_MODEL,
  PRODUCT_ATTRS,
} from '@/subapps/shop/common/constants';
import {isRelationalType} from '@/subapps/shop/common/utils';
import {FileAttr} from '@/subapps/shop/common/types';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      'product-id': string;
      'file-id': string;
      workspace: string;
    }>;
  },
) {
  const params = await props.params;
  const {'product-id': productId, 'file-id': fileId} = params;
  const {workspaceURL, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
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

  const metaFields = await findModelFields({
    modelName: BASE_PRODUCT_MODEL,
    modelField: PRODUCT_ATTRS,
    client,
  });

  const relationalFields = metaFields.filter(field =>
    isRelationalType(field.type),
  );

  const product = await client.aOSProduct.findOne({
    where: {
      ...and<AOSProduct>([filterPrivate({user: access.user}), {id: productId}]),
    },
    select: {
      productAttrs: true,
    },
  });

  const attrs = product?.productAttrs as unknown as Record<
    string,
    unknown
  > | null;

  if (!attrs) return new NextResponse('File not found', {status: 404});

  const fileBelongsToProduct = relationalFields.some(field => {
    const value = attrs[field.name];
    const values: unknown[] = Array.isArray(value) ? value : [value];

    return values.some(value => {
      const v = value as FileAttr | null;
      return (
        v?.id &&
        String(v.id) === fileId &&
        v.fileName &&
        v.fileType &&
        v.fileSize &&
        v.filePath
      );
    });
  });

  if (!fileBelongsToProduct) {
    return new NextResponse('File not found', {status: 404});
  }

  const file = await findFile({
    id: fileId,
    meta: true,
    client,
    storage: access.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}
