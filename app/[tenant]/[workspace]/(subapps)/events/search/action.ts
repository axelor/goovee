'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {manager} from '@/tenant';
import {getSession} from '@/auth';
import {ORDER_BY, SUBAPP_CODES} from '@/constants';
import {findWorkspace, findSubappAccess} from '@/orm/workspace';
import {TENANT_HEADER} from '@/proxy';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {EVENT_TYPE} from '@/subapps/events/common/constants';
import {findEvents, type ListEvent} from '@/subapps/events/common/orm/event';

const MIN_CHARS = 2;
const SEARCH_LIMIT = 200;

export async function searchEvents({
  search,
  workspaceURL,
}: {
  search: string;
  workspaceURL: string;
}): Promise<ListEvent[]> {
  const q = search?.trim() ?? '';
  if (q.length < MIN_CHARS || !workspaceURL) return [];

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return [];

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return [];
  const {client} = tenant;

  const session = await getSession();
  const user = session?.user;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.events,
    user,
    url: workspaceURL,
    client,
  });
  if (!subapp) return [];

  const workspace = await findWorkspace({user, url: workspaceURL, client});
  if (!workspace) return [];

  const result = await findEvents({
    limit: SEARCH_LIMIT,
    page: 1,
    categoryids: [],
    search: q,
    eventType: EVENT_TYPE.ACTIVE,
    workspaceURL,
    client,
    user,
    orderBy: {eventStartDateTime: ORDER_BY.ASC},
  }).then(clone);

  return (result?.events ?? []) as ListEvent[];
}
