import {notFound, redirect} from 'next/navigation';
import type {Cloned} from '@/types/util';
import {Suspense} from 'react';
import {Link} from '@/ui/components/link';
import {
  MdArrowForward,
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight,
  MdOutlinePlace,
} from 'react-icons/md';

// ---- CORE IMPORTS ----//
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import type {WorkspaceURLs} from '@/lib/core/url/workspace-urls';
import {getEventsConfig} from '@/subapps/events/common/orm/config';
import {clone} from '@/utils';
import type {Client} from '@/goovee/.generated/client';
import type {User} from '@/types';
import type {Workspace} from '@/orm/workspace';
import {Button} from '@/ui/components';
import {ORDER_BY, SUBAPP_CODES} from '@/constants';
import {cn} from '@/utils/css';
import {t} from '@/lib/core/locale/server';

// ---- LOCAL IMPORTS ---- //
import {EVENT_TYPE, LIMIT} from '@/subapps/events/common/constants';
import {findEvents, type ListEvent} from '@/subapps/events/common/orm/event';
import {EventLocalDate} from '@/subapps/events/common/ui/components/event-local-date';
import {EventSchedule} from '@/subapps/events/common/ui/components/event-schedule';

type FilterKey = 'upcoming' | 'ongoing' | 'past';

/* Each tab is a different slice of the same registrations, ordered so the
 * nearest event leads: ascending for what is still to come, descending for what
 * has passed. Without an explicit order findEvents falls back to descending,
 * which puts the furthest-away event first. */
const TAB_QUERY: Record<FilterKey, {eventType: string; order: string}> = {
  upcoming: {eventType: EVENT_TYPE.UPCOMING, order: ORDER_BY.ASC},
  ongoing: {eventType: EVENT_TYPE.ONGOING, order: ORDER_BY.ASC},
  past: {eventType: EVENT_TYPE.PAST, order: ORDER_BY.DESC},
};

type Filters = {
  page: number;
  query: string;
  categoryIds: string[];
  /* The raw parameter, so links can carry the filter the user chose, alongside
   * the parts findEvents actually filters on. */
  date: string;
  day?: number;
  month?: number;
  year?: number;
};

/* A page far beyond the data still reaches the database as an OFFSET, and a
 * large enough one overflows a bigint there, so the accepted range is capped
 * rather than merely required to be positive. */
const MAX_PAGE = 10_000;

function readFilters(searchParams: {
  page?: string;
  query?: string;
  category?: string | string[];
  date?: string;
}): Filters {
  const page = Math.trunc(Number(searchParams.page));
  const date = searchParams.date ? new Date(searchParams.date) : undefined;
  const hasDate = date != null && !Number.isNaN(date.getTime());

  return {
    page: Number.isSafeInteger(page) && page > 0 && page <= MAX_PAGE ? page : 1,
    query: searchParams.query?.trim() || '',
    /* Ids go straight into an id filter, so anything non-numeric would reach
     * the database as a malformed bigint. */
    categoryIds: searchParams.category
      ? [searchParams.category].flat().filter(id => /^\d+$/.test(id))
      : [],
    date: hasDate ? searchParams.date! : '',
    /* A date-only string parses as UTC midnight, so it has to be read back with
     * UTC getters or a server behind UTC resolves it to the previous day. */
    day: hasDate ? date.getUTCDate() : undefined,
    month: hasDate ? date.getUTCMonth() + 1 : undefined,
    year: hasDate ? date.getUTCFullYear() : undefined,
  };
}

export default async function Page(context: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{
    filter?: string;
    page?: string;
    query?: string;
    category?: string | string[];
    date?: string;
  }>;
}) {
  const searchParams = await context.searchParams;
  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    allowGuest: false,
  });

  if (!access.ok) return denyPage(access);

  const {user} = access;
  const {client} = access.tenant;

  const config = await getEventsConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  const workspace = clone(access.workspace);

  const filter: FilterKey =
    searchParams.filter === 'past'
      ? 'past'
      : searchParams.filter === 'ongoing'
        ? 'ongoing'
        : 'upcoming';

  const filters = readFilters(searchParams);

  return (
    <main className="bg-ink-25 w-full flex-1 min-h-0 flex flex-col">
      <Suspense
        key={`${filter}-${filters.page}-${filters.query}-${filters.categoryIds.join()}-${filters.date}`}
        fallback={<MyRegistrationsSkeleton />}>
        <MyRegistrations
          filters={filters}
          workspace={workspace}
          user={user}
          client={client}
          url={access.url}
          filter={filter}
        />
      </Suspense>
    </main>
  );
}

async function MyRegistrations({
  workspace,
  user,
  client,
  url,
  filter,
  filters,
}: {
  workspace: Workspace | Cloned<Workspace>;
  user?: User;
  client: Client;
  url: WorkspaceURLs;
  filter: FilterKey;
  filters: Filters;
}) {
  /* Only the visible tab needs its events. The other two need a total for their
   * badge, and pageInfo.count is the count of the whole filtered set rather
   * than of the rows returned, so a single row is enough to read it. */
  const fetchTab = (tab: FilterKey) => {
    const isActive = tab === filter;

    return findEvents({
      limit: isActive ? LIMIT : 1,
      page: isActive ? filters.page : 1,
      search: filters.query,
      categoryids: filters.categoryIds,
      day: filters.day,
      month: filters.month,
      year: filters.year,
      eventType: TAB_QUERY[tab].eventType,
      orderBy: {eventStartDateTime: TAB_QUERY[tab].order},
      workspaceURL: workspace.url,
      client,
      user,
      onlyRegisteredEvent: true,
    }).then(clone);
  };

  const [upcomingResult, ongoingResult, pastResult] = await Promise.all([
    fetchTab('upcoming'),
    fetchTab('ongoing'),
    fetchTab('past'),
  ]);

  const counts = {
    upcoming: Number(upcomingResult?.pageInfo?.count ?? 0),
    ongoing: Number(ongoingResult?.pageInfo?.count ?? 0),
    past: Number(pastResult?.pageInfo?.count ?? 0),
  };

  const activeResult =
    filter === 'upcoming'
      ? upcomingResult
      : filter === 'ongoing'
        ? ongoingResult
        : pastResult;

  const list = activeResult?.events ?? [];
  const pages = Number(activeResult?.pageInfo?.pages ?? 1);
  /* The spotlight leads the first page only; deeper pages are a plain list. */
  const next =
    filter === 'upcoming' && filters.page === 1 ? list[0] : undefined;

  const baseHref = url.forRouter(`/${SUBAPP_CODES.events}/my-registrations`);
  const allEventsHref = url.forRouter(`/${SUBAPP_CODES.events}`);

  /* Links keep whatever the user is filtering by. Switching tab returns to the
   * first page, since a page number only means something within one tab. */
  const hrefFor = ({tab, page}: {tab?: FilterKey; page?: number} = {}) => {
    const target = tab ?? filter;
    const params = new URLSearchParams();

    if (target !== 'upcoming') params.set('filter', target);
    if (filters.query) params.set('query', filters.query);
    for (const categoryId of filters.categoryIds) {
      params.append('category', categoryId);
    }
    if (filters.date) params.set('date', filters.date);
    if (page && page > 1) params.set('page', String(page));

    const search = params.toString();
    return search ? `${baseHref}?${search}` : baseHref;
  };

  /* Past the last page the query returns no rows, and with no rows there is no
   * total to read either — the counts would fall back to zero and the pager
   * would disappear, stranding the user. Bookmarking page 2 and returning after
   * the events have moved into the past is enough to land here, so send them
   * back to the first page of the same filters instead. */
  if (list.length === 0 && filters.page > 1) {
    redirect(hrefFor({page: 1}));
  }

  const [
    title,
    subtitle,
    upcomingTab,
    ongoingTab,
    pastTab,
    emptyUpcomingTitle,
    emptyOngoingTitle,
    emptyPastTitle,
    emptyUpcomingSubtitle,
    emptyOngoingSubtitle,
    emptyPastSubtitle,
    seeAllLabel,
  ] = await Promise.all([
    t('My registrations'),
    composeSubtitle(counts.upcoming, counts.past),
    t('Upcoming'),
    t('Ongoing'),
    t('History'),
    t('No registration yet'),
    t('No ongoing events'),
    t('No past events'),
    t('Browse upcoming events and register in one click.'),
    t('Events happening right now will appear here.'),
    t('Your past events will appear here.'),
    t('See all events'),
  ]);

  return (
    <div className="py-8 container mx-auto max-w-[1280px]">
      {/* Title row */}
      <header className="mb-6">
        <h1 className="text-[32px] font-extrabold text-ink-900 tracking-[-0.025em] leading-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
      </header>

      {/* Spotlight next event */}
      {next && (
        <NextEventSpotlight
          event={next}
          detailHref={url.forRouter(`/${SUBAPP_CODES.events}/${next.slug}`)}
        />
      )}

      {/* Filter tabs upcoming/past */}
      <div
        className={cn(
          'inline-flex gap-1 p-1 bg-white border border-ink-100 rounded-[10px]',
          next ? 'mt-9 mb-[18px]' : 'mt-5 mb-[18px]',
        )}>
        {[
          {
            key: 'upcoming' as const,
            label: upcomingTab,
            count: counts.upcoming,
          },
          {
            key: 'ongoing' as const,
            label: ongoingTab,
            count: counts.ongoing,
          },
          {key: 'past' as const, label: pastTab, count: counts.past},
        ].map(tab => {
          const isActive = filter === tab.key;
          const href = hrefFor({tab: tab.key});
          return (
            <Link
              key={tab.key}
              href={href}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-[7px] text-[13px] font-bold transition-colors',
                isActive
                  ? 'bg-royal text-white'
                  : 'bg-transparent text-ink-700 hover:bg-ink-50',
              )}>
              {tab.label}
              <span
                className={cn(
                  'text-[11px] px-1.5 py-0.5 rounded-full font-bold tabular-nums',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-ink-100 text-ink-500',
                )}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <EmptyState
          title={
            filter === 'upcoming'
              ? emptyUpcomingTitle
              : filter === 'ongoing'
                ? emptyOngoingTitle
                : emptyPastTitle
          }
          subtitle={
            filter === 'upcoming'
              ? emptyUpcomingSubtitle
              : filter === 'ongoing'
                ? emptyOngoingSubtitle
                : emptyPastSubtitle
          }
          ctaHref={filter === 'upcoming' ? allEventsHref : undefined}
          ctaLabel={seeAllLabel}
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {list.map(event => (
            <RegistrationCard
              key={event.id}
              event={event}
              detailHref={url.forRouter(
                `/${SUBAPP_CODES.events}/${event.slug}`,
              )}
              past={filter === 'past'}
            />
          ))}
        </div>
      )}

      {pages > 1 && (
        <Pager
          page={filters.page}
          pages={pages}
          hrefFor={targetPage => hrefFor({page: targetPage})}
        />
      )}
    </div>
  );
}

async function Pager({
  page,
  pages,
  hrefFor,
}: {
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
}) {
  const [previousLabel, nextLabel, positionLabel] = await Promise.all([
    t('Previous'),
    t('Next'),
    t('Page {0} of {1}', String(page), String(pages)),
  ]);

  const stepClassName =
    'inline-flex items-center gap-1 h-9 px-3 rounded-md border border-ink-150 bg-white text-sm font-semibold text-ink-700 transition-colors';

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className={cn(stepClassName, 'hover:bg-ink-25')}>
          <MdChevronLeft className="text-base" />
          {previousLabel}
        </Link>
      ) : (
        <span aria-disabled className={cn(stepClassName, 'opacity-40')}>
          <MdChevronLeft className="text-base" />
          {previousLabel}
        </span>
      )}
      <span className="px-2 text-[13px] text-ink-600 tabular-nums">
        {positionLabel}
      </span>
      {page < pages ? (
        <Link
          href={hrefFor(page + 1)}
          className={cn(stepClassName, 'hover:bg-ink-25')}>
          {nextLabel}
          <MdChevronRight className="text-base" />
        </Link>
      ) : (
        <span aria-disabled className={cn(stepClassName, 'opacity-40')}>
          {nextLabel}
          <MdChevronRight className="text-base" />
        </span>
      )}
    </div>
  );
}

// ---- Building blocks ---- //

async function composeSubtitle(upcomingCount: number, pastCount: number) {
  const [upcomingTpl, pastTpl] = await Promise.all([
    t(upcomingCount > 1 ? 'upcoming dates' : 'upcoming date'),
    t(pastCount > 1 ? 'past events' : 'past event'),
  ]);
  return `${upcomingCount} ${upcomingTpl} · ${pastCount} ${pastTpl}`;
}

async function NextEventSpotlight({
  event,
  detailHref,
}: {
  event: ListEvent;
  detailHref: string;
}) {
  const category = event.eventCategorySet?.[0];

  return (
    <section className="bg-white border border-mint-200 rounded-[18px] overflow-hidden shadow-soft-md grid grid-cols-1 md:grid-cols-[180px_1fr]">
      <div
        className="text-white p-7 flex flex-col items-center justify-center text-center relative"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--mint-500)) 0%, hsl(var(--mint-700)) 100%)',
        }}>
        <div className="absolute top-[14px] left-[14px] right-[14px] text-left text-[10px] font-bold uppercase tracking-[0.1em] text-white/85">
          ★ {await t('Next up')}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-85">
          <EventLocalDate date={event.eventStartDateTime} part="month" />
        </div>
        <div className="text-[56px] font-extrabold leading-none tabular-nums mt-1">
          <EventLocalDate date={event.eventStartDateTime} part="day" />
        </div>
        {!event.eventAllDay && (
          <div className="text-xs font-semibold opacity-85 tabular-nums mt-1">
            <EventLocalDate date={event.eventStartDateTime} part="time" />
          </div>
        )}
      </div>

      <div className="p-[22px_26px] flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-1 min-w-0">
          {category && (
            <div className="mb-2">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-white text-[10.5px] font-bold uppercase tracking-[0.04em]"
                style={{
                  backgroundColor: `var(--palette-${category.color ?? 'blue'}-dark)`,
                }}>
                {category.name}
              </span>
            </div>
          )}
          <div className="mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint-50 text-mint-700 text-[10.5px] font-bold">
              <MdCheckCircle className="text-xs" /> {await t('Registered')}
            </span>
          </div>
          <h2 className="m-0 text-[22px] font-bold tracking-[-0.015em] text-ink-900 leading-snug">
            {event.eventTitle}
          </h2>
          <div className="mt-2 flex flex-wrap gap-[18px] text-[13px] text-ink-600">
            <EventSchedule
              startDateTime={event.eventStartDateTime}
              endDateTime={event.eventEndDateTime}
              allDay={event.eventAllDay}
              className="gap-1.5"
              iconClassName="text-ink-400 text-sm"
            />
            {event.eventPlace && (
              <span className="inline-flex items-center gap-1.5">
                <MdOutlinePlace className="text-ink-400 text-sm" />
                {event.eventPlace}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <Button
            asChild
            variant="royal"
            size="sm"
            className="whitespace-nowrap gap-1.5">
            <Link href={detailHref}>
              {await t('View details')}
              <MdArrowForward className="text-sm" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

async function RegistrationCard({
  event,
  detailHref,
  past,
}: {
  event: ListEvent;
  detailHref: string;
  past: boolean;
}) {
  const category = event.eventCategorySet?.[0];

  return (
    <article
      className={cn(
        'bg-white border border-ink-100 rounded-2xl p-4 grid grid-cols-[72px_1fr] md:grid-cols-[72px_1fr_auto] gap-[18px] items-center transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-soft-md',
        past && 'opacity-[0.78]',
      )}>
      <div
        className={cn(
          'rounded-[10px] py-2.5 flex flex-col items-center justify-center',
          past ? 'bg-ink-50 text-ink-600' : 'bg-royal-pale text-royal-dark',
        )}>
        <div className="text-[10px] font-bold uppercase tracking-[0.06em] opacity-70">
          <EventLocalDate date={event.eventStartDateTime} part="month" />
        </div>
        <div className="text-[26px] font-extrabold leading-[1.05] tabular-nums">
          <EventLocalDate date={event.eventStartDateTime} part="day" />
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {category && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-white text-[10.5px] font-bold uppercase tracking-[0.04em]"
              style={{
                backgroundColor: `var(--palette-${category.color ?? 'blue'}-dark)`,
              }}>
              {category.name}
            </span>
          )}
          {past ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 text-[10.5px] font-bold">
              {await t('Past')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-mint-50 text-mint-700 text-[10.5px] font-bold">
              <MdCheckCircle className="text-[10px]" /> {await t('Confirmed')}
            </span>
          )}
        </div>
        <h3 className="m-0 text-[15.5px] font-bold tracking-[-0.01em] text-ink-900 line-clamp-1">
          {event.eventTitle}
        </h3>
        <div className="mt-1.5 flex flex-wrap gap-[14px] text-xs text-ink-600">
          <EventSchedule
            startDateTime={event.eventStartDateTime}
            endDateTime={event.eventEndDateTime}
            allDay={event.eventAllDay}
            className="gap-1"
            iconClassName="text-ink-400"
          />
          {event.eventPlace && (
            <span className="inline-flex items-center gap-1">
              <MdOutlinePlace className="text-ink-400" />
              {event.eventPlace}
            </span>
          )}
        </div>
      </div>

      <div className="hidden md:flex flex-col gap-1.5 items-stretch">
        <Button asChild variant="royal" size="sm" className="whitespace-nowrap">
          <Link href={detailHref}>{await t('Details')}</Link>
        </Button>
      </div>
    </article>
  );
}

function EmptyState({
  title,
  subtitle,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  subtitle: string;
  ctaHref?: string;
  ctaLabel: string;
}) {
  return (
    <div className="bg-white border border-ink-100 rounded-2xl p-14 text-center">
      <div className="text-4xl mb-2.5">📅</div>
      <p className="text-[15px] font-semibold text-ink-900">{title}</p>
      <p className="mt-1.5 mb-4 text-[13px] text-ink-500">{subtitle}</p>
      {ctaHref && (
        <Button asChild variant="royal" size="sm">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}

function MyRegistrationsSkeleton() {
  return (
    <div className="py-8 container mx-auto max-w-[1280px]">
      <div className="h-9 w-72 bg-ink-100 rounded mb-2 animate-pulse" />
      <div className="h-4 w-96 bg-ink-100 rounded mb-6 animate-pulse" />
      <div className="h-[180px] bg-ink-100 rounded-[18px] animate-pulse mb-6" />
      <div className="flex flex-col gap-3.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-[110px] bg-ink-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
