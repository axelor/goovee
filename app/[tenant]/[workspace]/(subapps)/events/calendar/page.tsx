import {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace, type Workspace} from '@/orm/workspace';
import {clone} from '@/utils';
import type {Client} from '@/goovee/.generated/client';
import type {User} from '@/types';
import type {Cloned} from '@/types/util';
import {workspacePathname} from '@/utils/workspace';
import {ORDER_BY, SUBAPP_CODES} from '@/constants';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {EVENT_TYPE} from '@/subapps/events/common/constants';
import {findEvents} from '@/subapps/events/common/orm/event';
import {EventsAgenda} from '@/subapps/events/common/ui/components/events-agenda';
import {searchEvents} from '@/subapps/events/search/action';

const FETCH_LIMIT = 200;

export default async function Page(context: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await context.params;
  const {tenant: tenantId} = params;

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  }).then(clone);
  if (!workspace) return notFound();

  return (
    <main className="bg-ink-25 w-full flex-1 min-h-0 flex flex-col">
      <Suspense fallback={<AgendaSkeleton />}>
        <AgendaData
          workspace={workspace}
          user={user}
          client={client}
          workspaceURI={workspaceURI}
          workspaceURL={workspaceURL}
        />
      </Suspense>
    </main>
  );
}

async function AgendaData({
  workspace,
  user,
  client,
  workspaceURI,
  workspaceURL,
}: {
  workspace: Workspace | Cloned<Workspace>;
  user: User | null | undefined;
  client: Client;
  workspaceURI: string;
  workspaceURL: string;
}) {
  const result = await findEvents({
    limit: FETCH_LIMIT,
    page: 1,
    categoryids: [],
    eventType: EVENT_TYPE.ACTIVE,
    workspaceURL,
    client,
    user,
    orderBy: {eventStartDateTime: ORDER_BY.ASC},
  }).then(clone);

  const events = (result?.events ?? []).filter(e => e.eventStartDateTime);

  const magazineHref = `${workspaceURI}/${SUBAPP_CODES.events}`;

  return (
    <EventsAgenda
      initialEvents={events}
      workspaceURI={workspaceURI}
      workspaceURL={workspaceURL}
      magazineHref={magazineHref}
      searchAction={searchEvents}
    />
  );
}

function AgendaSkeleton() {
  return (
    <div className="max-w-[960px] mx-auto px-8 pt-8 pb-14">
      <div className="h-9 w-56 bg-ink-100 rounded mb-2 animate-pulse" />
      <div className="h-4 w-80 bg-ink-100 rounded mb-6 animate-pulse" />
      <div className="h-12 w-full bg-ink-100 rounded-xl mb-3 animate-pulse" />
      <div className="h-14 w-full bg-ink-100 rounded-xl mb-6 animate-pulse" />
      {[0, 1].map(g => (
        <div key={g} className="mb-7">
          <div className="h-3 w-24 bg-ink-100 rounded mb-3 animate-pulse" />
          <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="grid grid-cols-[68px_1fr_auto] gap-[18px] items-center px-5 py-4 border-b border-ink-100 last:border-b-0">
                <div className="h-14 bg-ink-100 rounded-xl animate-pulse" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-24 bg-ink-100 rounded animate-pulse" />
                  <div className="h-4 w-52 bg-ink-100 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-ink-100 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-ink-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
