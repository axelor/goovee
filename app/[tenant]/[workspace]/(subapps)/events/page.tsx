import {Suspense} from 'react';
import type {Cloned} from '@/types/util';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ----//
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {getEventsConfig} from '@/subapps/events/common/orm/config';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {ORDER_BY, SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {t} from '@/lib/core/locale/server';
import type {User} from '@/types';
import type {Workspace} from '@/orm/workspace';
import type {Client} from '@/goovee/.generated/client';

// ---- LOCAL IMPORTS ---- //
import {EVENT_TYPE} from '@/subapps/events/common/constants';
import {findEvents} from '@/subapps/events/common/orm/event';
import {findEventCategories} from '@/subapps/events/common/orm/event-category';
import {
  MagazineHub,
  type MagazineHubLabels,
} from '@/subapps/events/common/ui/components';
import {searchEvents} from '@/subapps/events/search/action';

const MAGAZINE_LIMIT = 13; // 1 featured + 12 in the grid (max)

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  if (!access.ok) {
    if (
      access.reason === 'workspace-not-found' ||
      access.reason === 'app-not-installed'
    ) {
      notFound();
    }
    if (!access.user) {
      redirect(
        getLoginURL({
          callbackurl: await getCurrentPath(),
          workspaceURI,
          [SEARCH_PARAMS.TENANT_ID]: tenant,
        }),
      );
    }
    unauthorized();
  }

  const {user} = access;
  const {client} = access.tenant;

  const config = await getEventsConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  const workspace = clone(access.workspace);

  return (
    <main className="bg-ink-25 w-full flex-1 min-h-0 flex flex-col">
      <Suspense fallback={<MagazineSkeleton />}>
        <Magazine
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

async function Magazine({
  workspace,
  user,
  client,
  workspaceURI,
  workspaceURL,
}: {
  workspace: Workspace | Cloned<Workspace>;
  user?: User;
  client: Client;
  workspaceURI: string;
  workspaceURL: string;
}) {
  const [activeResult, pastResult, categories]: [any, any, any] =
    await Promise.all([
      findEvents({
        limit: MAGAZINE_LIMIT,
        page: 1,
        categoryids: [],
        eventType: EVENT_TYPE.ACTIVE,
        workspaceURL: workspace.url,
        client,
        user,
        orderBy: {eventStartDateTime: ORDER_BY.ASC},
      }).then(clone),
      findEvents({
        limit: MAGAZINE_LIMIT,
        page: 1,
        categoryids: [],
        eventType: EVENT_TYPE.PAST,
        workspaceURL: workspace.url,
        client,
        user,
        orderBy: {eventStartDateTime: ORDER_BY.DESC},
      }).then(clone),
      findEventCategories({workspaceURL: workspace.url, client, user}).then(
        clone,
      ),
    ]);

  const activeEvents: any[] = activeResult?.events ?? [];
  const pastEvents: any[] = pastResult?.events ?? [];

  const [
    title,
    upcomingDates,
    upcomingDate,
    pastCount,
    registerNow,
    daysLabel,
    upcomingHeading,
    emptyActive,
    emptyPast,
    seeLabel,
    freeLabel,
    agendaView,
    filtersLabel,
    activeTab,
    pastTab,
    featuredBadge,
    replayBadge,
    registeredBadge,
    pastCta,
    replayHeading,
    categoryLabel,
    clearAllLabel,
  ] = await Promise.all([
    t('Events & training'),
    t('upcoming dates'),
    t('upcoming date'),
    t('past'),
    t('Register now'),
    t('days'),
    t('Upcoming'),
    t('No upcoming events'),
    t('No past events'),
    t('See'),
    t('Free'),
    t('Agenda view'),
    t('Filters'),
    t('Active events'),
    t('Past events'),
    t('Featured'),
    t('Replay available'),
    t('Registered'),
    t('View details'),
    t('Other replays'),
    t('Category'),
    t('Clear all'),
  ]);

  const labels: MagazineHubLabels = {
    title,
    upcomingDates,
    upcomingDate,
    pastCount,
    registerNow,
    daysLabel,
    upcomingHeading,
    emptyActive,
    emptyPast,
    seeLabel,
    freeLabel,
    agendaView,
    filtersLabel,
    activeTab,
    pastTab,
    featuredBadge,
    replayBadge,
    registeredBadge,
    pastCta,
    replayHeading,
    categoryLabel,
    clearAllLabel,
  };

  return (
    <MagazineHub
      activeEvents={activeEvents}
      pastEvents={pastEvents}
      categories={categories ?? []}
      workspaceURI={workspaceURI}
      workspaceURL={workspaceURL}
      labels={labels}
      searchAction={searchEvents}
    />
  );
}

function MagazineSkeleton() {
  return (
    <div className="py-8 container mx-auto max-w-[1280px]">
      <div className="h-9 w-72 bg-ink-100 rounded mb-2 animate-pulse" />
      <div className="h-4 w-96 bg-ink-100 rounded mb-6 animate-pulse" />
      <div className="h-[380px] bg-ink-100 rounded-[20px] animate-pulse" />
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="h-[380px] bg-ink-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
