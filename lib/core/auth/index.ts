import type {ReadonlyHeaders} from 'next/dist/server/web/spec-extension/adapters/headers';
import {headers} from 'next/headers';

import {getAuth} from '@/lib/auth';
import {TENANT_HEADER} from '@/proxy';

const getSessionBase = async (headerList: ReadonlyHeaders) => {
  /* Whose session this is follows the address the request arrived at, not the
   * cookies it carries: a browser may hold a session for several tenants of one
   * deployment, and only the one whose address this is may answer here. */
  const tenantId = headerList.get(TENANT_HEADER);

  if (!tenantId) return null;

  return getAuth(tenantId).api.getSession({headers: headerList});
};

// Next.js 'headers()' returns a unique object per request.
const requestCache = new WeakMap<Headers, ReturnType<typeof getSessionBase>>();

export async function getSession() {
  const headerList = await headers();

  if (!requestCache.has(headerList)) {
    requestCache.set(headerList, getSessionBase(headerList));
  }

  return requestCache.get(headerList);
}
