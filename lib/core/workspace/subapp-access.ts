import 'server-only';

import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findSubappAccess, type Subapp} from '@/orm/workspace';
import {getLoginURL} from '@/utils/url';
import {SEARCH_PARAMS} from '@/constants';
import type {User} from '@/types';
import type {Client} from '@/goovee/.generated/client';

export type SubappDenial = 'login' | 'unauthorized' | 'notFound';

export async function classifySubappAccess(params: {
  code: string;
  url: string;
  user: User | undefined;
  client: Client;
}): Promise<{ok: true; subapp: Subapp} | {ok: false; reason: SubappDenial}> {
  const {code, url, user, client} = params;

  const subapp = await findSubappAccess({code, url, user, client});
  if (subapp) return {ok: true, subapp};

  const app = await client.aOSPortalApp.findOne({
    where: {code},
    select: {isInstalled: true},
  });
  if (!app?.isInstalled) return {ok: false, reason: 'notFound'};

  return {ok: false, reason: user ? 'unauthorized' : 'login'};
}

export async function requireSubappAccess(params: {
  code: string;
  url: string;
  user: User | undefined;
  client: Client;
  workspaceURI: string;
  tenantId: string;
}): Promise<Subapp> {
  const {code, url, user, client, workspaceURI, tenantId} = params;

  const res = await classifySubappAccess({code, url, user, client});
  if (res.ok) return res.subapp;

  if (res.reason === 'login') {
    redirect(
      getLoginURL({
        callbackurl: workspaceURI,
        workspaceURI,
        [SEARCH_PARAMS.TENANT_ID]: tenantId,
      }),
    );
  }
  if (res.reason === 'unauthorized') {
    unauthorized();
  }
  notFound();
}
