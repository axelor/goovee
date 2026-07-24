'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {ORDER_BY, SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {TENANT_HEADER} from '@/proxy';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {SearchEventsSchema} from '@/subapps/events/common/actions/validators';
import {findEvents, type ListEvent} from '@/subapps/events/common/orm/event';

const MIN_CHARS = 2;
const SEARCH_LIMIT = 200;

export async function searchEvents(props: {
  search: string;
  workspaceURL: string;
}): Promise<ListEvent[]> {
  const parsed = SearchEventsSchema.safeParse(props);
  if (!parsed.success) return [];
  const {workspaceURL} = parsed.data;

  const q = parsed.data.search.trim();
  if (q.length < MIN_CHARS) return [];

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return [];

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) return [];

  const {user} = access;
  const {client} = access.tenant;

  const result = await findEvents({
    limit: SEARCH_LIMIT,
    page: 1,
    categoryids: [],
    search: q,
    // No eventType filter: search must reach past events too, not just active.
    workspaceURL,
    client,
    user,
    orderBy: {eventStartDateTime: ORDER_BY.ASC},
  }).then(clone);

  return (result?.events ?? []) as ListEvent[];
}
