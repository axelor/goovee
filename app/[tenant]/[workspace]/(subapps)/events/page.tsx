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
  searchParams: Promise<{type?: string; category?: string; page?: string}>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

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
          type={searchParams?.type === 'past' ? 'past' : 'active'}
          category={searchParams?.category || null}
          page={Number(searchParams?.page) || 1}
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
  type,
  category,
  page,
}: {
  workspace: Workspace | Cloned<Workspace>;
  user?: User;
  client: Client;
  workspaceURI: string;
  workspaceURL: string;
  type: 'active' | 'past';
  category: string | null;
  page: number;
}) {
  const isPast = type === 'past';
  const categoryids = category ? [category] : [];

  // Server-driven: fetch the current tab's page (with category filter), plus a
  // count-only query for the other tab so both tab badges stay accurate over
  // the full dataset (not just the first page).
  const [currentResult, otherResult, categories] = await Promise.all([
    findEvents({
      limit: MAGAZINE_LIMIT,
      page,
      categoryids,
      eventType: isPast ? EVENT_TYPE.PAST : EVENT_TYPE.ACTIVE,
      workspaceURL: workspace.url,
      client,
      user,
      orderBy: {
        eventStartDateTime: isPast ? ORDER_BY.DESC : ORDER_BY.ASC,
      },
    }).then(clone),
    findEvents({
      limit: 1,
      page: 1,
      categoryids,
      eventType: isPast ? EVENT_TYPE.ACTIVE : EVENT_TYPE.PAST,
      workspaceURL: workspace.url,
      client,
      user,
      orderBy: {eventStartDateTime: ORDER_BY.ASC},
    }).then(clone),
    findEventCategories({workspaceURL: workspace.url, client, user}).then(
      clone,
    ),
  ]);

  const events = currentResult?.events ?? [];
  const pageInfo = currentResult?.pageInfo;
  const currentCount = Number(pageInfo?.count ?? 0);
  const otherCount = Number(otherResult?.pageInfo?.count ?? 0);
  const activeTotal = isPast ? otherCount : currentCount;
  const pastTotal = isPast ? currentCount : otherCount;

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
      events={events}
      pageInfo={pageInfo}
      currentType={type}
      currentCategory={category}
      activeCount={activeTotal}
      pastCount={pastTotal}
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
