import axios from 'axios';
import {headers} from 'next/headers';

import {manager} from '@/lib/core/tenant';
import {TENANT_HEADER} from '@/proxy';

export async function getModelData(model: string) {
  const tenantId = (await headers()).get(TENANT_HEADER);

  const tenant = await manager.getTenant(tenantId as string);
  const aos = tenant?.config?.aos;

  if (!aos?.url) return [];

  const res = await axios
    .get(`${aos.url}/ws/rest/${model}`, {
      auth: aos.auth,
    })
    .then(res => res?.data)
    .catch(() => console.log('Error with trying to fetch model data'));

  return res?.data ?? [];
}

export async function getModelFields(model: string) {
  const tenantId = (await headers()).get(TENANT_HEADER);

  const tenant = await manager.getTenant(tenantId as string);
  const aos = tenant?.config?.aos;

  if (!aos?.url) return [];

  const res = await axios
    .get(`${aos.url}/ws/meta/fields/${model}`, {auth: aos.auth})
    .then(res => res?.data?.data)
    .catch(() => console.log('Error with trying to fetch model fields'));

  if (!res) return [];

  const result: any[] = [];

  result.push(...res.fields);

  Object.values(res.jsonFields).forEach((_fields: any) => {
    result.push(
      ...Object.entries(_fields).map(([key, content]: any) => ({
        name: key,
        ...content,
      })),
    );
  });

  return result;
}
