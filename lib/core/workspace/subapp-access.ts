import 'server-only';

import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findSubappAccess, type Subapp} from '@/orm/workspace';
import {getLoginURL} from '@/utils/url';
import {SEARCH_PARAMS} from '@/constants';
import type {User} from '@/types';
import type {Client} from '@/goovee/.generated/client';

/**
 * Resolves the current subapp for the request and enforces access.
 *
 * - Available  -> returns the Subapp.
 * - Unavailable & guest      -> redirect to the login page.
 * - Unavailable & authenticated -> 404 (notFound).
 *
 * `redirect` and `notFound` throw, so the returned `Subapp` is always defined
 * for callers that reach the return value.
 */
export async function requireSubappAccess(params: {
  code: string;
  url: string; // workspaceURL
  user: User | undefined;
  client: Client;
  workspaceURI: string;
  tenantId: string;
}): Promise<Subapp> {
  const {code, url, user, client, workspaceURI, tenantId} = params;

  const subapp = await findSubappAccess({code, url, user, client});

  if (!subapp) {
    if (!user) {
      redirect(
        getLoginURL({
          callbackurl: workspaceURI,
          workspaceURI,
          [SEARCH_PARAMS.TENANT_ID]: tenantId,
        }),
      );
    }
    notFound();
  }

  return subapp;
}
