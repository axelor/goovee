import {notFound, redirect, unauthorized} from 'next/navigation';
import type {Cloned} from '@/types/util';
import {Suspense} from 'react';
import {Link} from '@/ui/components/link';
import {
  MdArrowForward,
  MdCheckCircle,
  MdOutlinePlace,
  MdOutlineSchedule,
} from 'react-icons/md';

// ---- CORE IMPORTS ----//
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {getEventsConfig} from '@/subapps/events/common/orm/config';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import type {Client} from '@/goovee/.generated/client';
import type {User} from '@/types';
import type {Workspace} from '@/orm/workspace';
import {Button} from '@/ui/components';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {cn} from '@/utils/css';
import {t} from '@/lib/core/locale/server';

// ---- LOCAL IMPORTS ---- //
import {EVENT_TYPE} from '@/subapps/events/common/constants';
import {findEvents, type ListEvent} from '@/subapps/events/common/orm/event';
import {EventLocalDate} from '@/subapps/events/common/ui/components/event-local-date';

const FETCH_LIMIT = 200;

type FilterKey = 'upcoming' | 'past';

export default async function Page(context: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{filter?: string}>;
}) {
  const params = await context.params;
  const searchParams = await context.searchParams;

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: false,
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

  const filter: FilterKey =
    searchParams.filter === 'past' ? 'past' : 'upcoming';

  return (
    <main className="bg-ink-25 w-full flex-1 min-h-0 flex flex-col">
      <Suspense fallback={<MyRegistrationsSkeleton />}>
        <MyRegistrations
          workspace={workspace}
          user={user}
          client={client}
          workspaceURI={workspaceURI}
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
  workspaceURI,
  filter,
}: {
  workspace: Workspace | Cloned<Workspace>;
  user?: User;
  client: Client;
  workspaceURI: string;
  filter: FilterKey;
}) {
  const [upcomingResult, pastResult] = await Promise.all([
    findEvents({
      limit: FETCH_LIMIT,
      page: 1,
      categoryids: [],
      eventType: EVENT_TYPE.UPCOMING,
      workspaceURL: workspace.url,
      client,
      user,
      onlyRegisteredEvent: true,
    }).then(clone),
    findEvents({
      limit: FETCH_LIMIT,
      page: 1,
      categoryids: [],
      eventType: EVENT_TYPE.PAST,
      workspaceURL: workspace.url,
      client,
      user,
      onlyRegisteredEvent: true,
    }).then(clone),
  ]);

  const upcoming = upcomingResult?.events ?? [];
  const past = pastResult?.events ?? [];
  const list = filter === 'upcoming' ? upcoming : past;
  const next = upcoming[0];

  const baseHref = `${workspaceURI}/${SUBAPP_CODES.events}/my-registrations`;
  const allEventsHref = `${workspaceURI}/${SUBAPP_CODES.events}`;

  const [
    title,
    subtitle,
    upcomingTab,
    pastTab,
    emptyUpcomingTitle,
    emptyPastTitle,
    emptyUpcomingSubtitle,
    emptyPastSubtitle,
    seeAllLabel,
  ] = await Promise.all([
    t('My registrations'),
    composeSubtitle(upcoming.length, past.length),
    t('Upcoming'),
    t('History'),
    t('No registration yet'),
    t('No past events'),
    t('Browse upcoming events and register in one click.'),
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
      {filter === 'upcoming' && next && (
        <NextEventSpotlight
          event={next}
          detailHref={`${workspaceURI}/${SUBAPP_CODES.events}/${next.slug}`}
        />
      )}

      {/* Filter tabs upcoming/past */}
      <div
        className={cn(
          'inline-flex gap-1 p-1 bg-white border border-ink-100 rounded-[10px]',
          filter === 'upcoming' && next ? 'mt-9 mb-[18px]' : 'mt-5 mb-[18px]',
        )}>
        {[
          {
            key: 'upcoming' as const,
            label: upcomingTab,
            count: upcoming.length,
          },
          {key: 'past' as const, label: pastTab, count: past.length},
        ].map(tab => {
          const isActive = filter === tab.key;
          const href =
            tab.key === 'past' ? `${baseHref}?filter=past` : baseHref;
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
          title={filter === 'upcoming' ? emptyUpcomingTitle : emptyPastTitle}
          subtitle={
            filter === 'upcoming' ? emptyUpcomingSubtitle : emptyPastSubtitle
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
              detailHref={`${workspaceURI}/${SUBAPP_CODES.events}/${event.slug}`}
              past={filter === 'past'}
            />
          ))}
        </div>
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

function NextEventSpotlight({
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
          ★ Prochain RDV
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-85">
          <EventLocalDate date={event.eventStartDateTime} part="month" />
        </div>
        <div className="text-[56px] font-extrabold leading-none tabular-nums mt-1">
          <EventLocalDate date={event.eventStartDateTime} part="day" />
        </div>
        <div className="text-xs font-semibold opacity-85 tabular-nums mt-1">
          <EventLocalDate date={event.eventStartDateTime} part="time" />
        </div>
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
              <MdCheckCircle className="text-xs" /> Inscrit
            </span>
          </div>
          <h2 className="m-0 text-[22px] font-bold tracking-[-0.015em] text-ink-900 leading-snug">
            {event.eventTitle}
          </h2>
          <div className="mt-2 flex flex-wrap gap-[18px] text-[13px] text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <MdOutlineSchedule className="text-ink-400 text-sm" />
              <span className="tabular-nums">
                <EventLocalDate date={event.eventStartDateTime} part="time" />
                {event.eventEndDateTime ? (
                  <>
                    {' – '}
                    <EventLocalDate date={event.eventEndDateTime} part="time" />
                  </>
                ) : (
                  ''
                )}
              </span>
            </span>
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
              Voir le détail
              <MdArrowForward className="text-sm" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function RegistrationCard({
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
              Terminé
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-mint-50 text-mint-700 text-[10.5px] font-bold">
              <MdCheckCircle className="text-[10px]" /> Confirmé
            </span>
          )}
        </div>
        <h3 className="m-0 text-[15.5px] font-bold tracking-[-0.01em] text-ink-900 line-clamp-1">
          {event.eventTitle}
        </h3>
        <div className="mt-1.5 flex flex-wrap gap-[14px] text-xs text-ink-600">
          <span className="inline-flex items-center gap-1">
            <MdOutlineSchedule className="text-ink-400" />
            <span className="tabular-nums">
              <EventLocalDate date={event.eventStartDateTime} part="time" />
              {event.eventEndDateTime ? (
                <>
                  {' – '}
                  <EventLocalDate date={event.eventEndDateTime} part="time" />
                </>
              ) : (
                ''
              )}
            </span>
          </span>
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
          <Link href={detailHref}>Détails</Link>
        </Button>
        {past && (
          <Button
            variant="ink-outline"
            size="sm"
            className="whitespace-nowrap"
            disabled>
            Attestation
          </Button>
        )}
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
