import {headers} from 'next/headers';

import {manager} from '@/lib/core/tenant';
import {TENANT_HEADER} from '@/proxy';
import {clone} from '@/utils';

import {SchemaType, ViewSchema} from '../types';
import {getModelFields} from '../actions';

export async function findView({
  name,
  schemaType,
}: {
  name: string;
  schemaType: SchemaType;
}): Promise<{schema?: ViewSchema; metaFields?: any[]}> {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) return {};

  const c = await manager.getClient(tenantId);

  const schema: any = await c.aOSStudioResource
    .findOne({
      where: {
        name,
        type: 'VIEW',
        schemaType,
      },
      select: {
        name: true,
        content: true,
        schemaModel: true,
      },
    })
    .then(async (res: any) =>
      res ? {...res, content: JSON.parse(res.content)} : undefined,
    )
    .then(clone)
    .catch(() => undefined);

  if (!schema) return {};

  const metaFields: any[] = await getModelFields(schema.schemaModel);

  return {schema: schema.content?.schema, metaFields};
}
