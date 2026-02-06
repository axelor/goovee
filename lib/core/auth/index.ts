import type {ReadonlyHeaders} from 'next/dist/server/web/spec-extension/adapters/headers';
import {headers} from 'next/headers';
import {auth} from '@/lib/auth';

const getSessionBase = async (headerList: ReadonlyHeaders) => {
  return auth.api.getSession({
    headers: headerList,
  });
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
