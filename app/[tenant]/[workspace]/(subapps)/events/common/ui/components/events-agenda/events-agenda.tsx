'use client';

import {useEffect, useMemo, useState} from 'react';
import {Link} from '@/ui/components/link';
import {
  MdCalendarToday,
  MdChevronRight,
  MdGridView,
  MdOutlineAccessTime,
  MdOutlinePlace,
  MdSearch,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {formatDate} from '@/locale/formatters';
import {Button} from '@/ui/components';
import {SUBAPP_CODES} from '@/constants';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import type {ListEvent} from '@/subapps/events/common/orm/event';

type QuickRange = {key: string; label: string; from: string; to: string};

export function EventsAgenda({
  initialEvents,
  workspaceURI,
  workspaceURL,
  magazineHref,
  searchAction,
}: {
  initialEvents: ListEvent[];
  workspaceURI: string;
  workspaceURL: string;
  magazineHref: string;
  searchAction: (args: {
    search: string;
    workspaceURL: string;
  }) => Promise<ListEvent[]>;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ListEvent[]>(initialEvents);
  const [searching, setSearching] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const hasQuery = query.trim().length >= 2;

  // Debounced ORM search (server action), like before the redesign.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(initialEvents);
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const handle = setTimeout(() => {
      searchAction({search: q, workspaceURL})
        .then(res => {
          if (active) setResults(res);
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, searchAction, workspaceURL, initialEvents]);

  const quickRanges = useMemo<QuickRange[]>(() => buildQuickRanges(), []);

  // Client-side date-range narrowing of the current (search or initial) list.
  const filtered = useMemo(() => {
    const fromDate = from ? new Date(`${from}T00:00:00`) : null;
    const toDate = to ? new Date(`${to}T23:59:59`) : null;
    return results.filter(e => {
      if (!e.eventStartDateTime) return false;
      const d = new Date(e.eventStartDateTime);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [results, from, to]);

  const groups = useMemo(() => groupByMonth(filtered), [filtered]);

  const hasDateFilter = !!(from || to);

  const resetDates = () => {
    setFrom('');
    setTo('');
  };

  const dateInputClass =
    'border border-ink-150 rounded-[9px] px-[11px] py-2 text-[13px] text-ink-800 bg-white outline-none focus:border-royal focus:shadow-[0_0_0_3px_rgba(21,84,181,0.12)] transition';

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="max-w-[960px] mx-auto px-8 pt-8 pb-14">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-[18px]">
          <div>
            <h1 className="m-0 text-[32px] font-extrabold text-ink-900 tracking-[-0.025em]">
              {i18n.t('Agenda')}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {i18n.t('Your upcoming events in chronological order')}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button asChild variant="ink-outline" size="sm" className="gap-1.5">
              <Link href={magazineHref}>
                <MdGridView className="text-base" />
                {i18n.t('Magazine view')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-royal text-lg" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={i18n.t('Search an event')}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-royal-pale/60 border border-royal-border text-sm text-ink-800 placeholder:text-ink-400 outline-none focus:border-royal focus:bg-royal-pale focus:shadow-[0_0_0_3px_rgba(21,84,181,0.12)] transition"
          />
          {searching && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-ink-400">
              {i18n.t('Searching…')}
            </span>
          )}
        </div>

        {/* Date filter bar */}
        <div className="flex items-center gap-3.5 flex-wrap bg-white border border-ink-100 rounded-xl px-4 py-3 mb-[22px] shadow-xs">
          <span className="inline-flex items-center gap-[7px] text-[13px] font-bold text-ink-700">
            <MdCalendarToday className="text-[15px] text-royal" />
            {i18n.t('Filter by date')}
          </span>
          <div className="flex items-center gap-2">
            <label className="text-[12.5px] text-ink-500">
              {i18n.t('Date from')}
            </label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className={dateInputClass}
            />
            <label className="text-[12.5px] text-ink-500">
              {i18n.t('Date to')}
            </label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className={dateInputClass}
            />
          </div>
          <div className="flex gap-1.5">
            {quickRanges.map(r => {
              const on = from === r.from && to === r.to;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    if (on) {
                      resetDates();
                    } else {
                      setFrom(r.from);
                      setTo(r.to);
                    }
                  }}
                  className={cn(
                    'text-xs font-semibold px-3 py-[7px] rounded-full transition-colors',
                    on
                      ? 'bg-royal text-white'
                      : 'bg-white text-ink-700 border border-ink-150 hover:bg-ink-25',
                  )}>
                  {r.label}
                </button>
              );
            })}
          </div>
          {hasDateFilter && (
            <button
              type="button"
              onClick={resetDates}
              className="ml-auto text-[12.5px] font-bold text-royal hover:text-royal-dark">
              {i18n.t('Reset')}
            </button>
          )}
        </div>

        {/* List / empty state */}
        {groups.length === 0 ? (
          <div className="bg-white border border-ink-100 rounded-2xl shadow-xs px-5 py-12 text-center">
            <div className="inline-flex w-12 h-12 rounded-xl bg-royal-pale text-royal items-center justify-center mb-3">
              <MdCalendarToday className="text-[22px]" />
            </div>
            <div className="text-[15px] font-bold text-ink-800">
              {hasQuery
                ? i18n.t('No events found')
                : i18n.t('No events for this period')}
            </div>
            <div className="text-[13px] text-ink-500 mt-1">
              {i18n.t('Adjust the dates or reset the filter.')}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            {groups.map(group => (
              <section key={group.key}>
                <div className="mb-3 pl-0.5 text-xs font-extrabold uppercase tracking-[0.08em] text-royal">
                  {group.label}
                </div>
                <div className="bg-white border border-ink-100 rounded-2xl shadow-xs overflow-hidden">
                  {group.events.map((event, i) => (
                    <AgendaRow
                      key={event.id}
                      event={event}
                      workspaceURI={workspaceURI}
                      last={i === group.events.length - 1}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Building blocks ---- //

function AgendaRow({
  event,
  workspaceURI,
  last,
}: {
  event: ListEvent;
  workspaceURI: string;
  last: boolean;
}) {
  const start = new Date(event.eventStartDateTime ?? '');
  const day = start.getDate();
  const monthAbbr = monthAbbrev(start);
  const time = formatHHmm(start);
  const cat = event.eventCategorySet?.[0];
  const detailHref = `${workspaceURI}/${SUBAPP_CODES.events}/${event.slug}`;

  return (
    <Link
      href={detailHref}
      className={cn(
        'grid grid-cols-[68px_1fr_auto] gap-[18px] items-center px-5 py-4 transition-colors hover:bg-ink-25',
        !last && 'border-b border-ink-100',
      )}>
      {/* Date block */}
      <div className="text-center bg-royal-pale rounded-xl py-2">
        <div className="text-[22px] font-extrabold text-royal-dark leading-none tabular-nums">
          {day}
        </div>
        <div className="text-[10.5px] font-bold text-royal uppercase mt-0.5">
          {monthAbbr}
        </div>
      </div>

      {/* Title + meta */}
      <div className="min-w-0">
        {cat?.name && (
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center px-[9px] py-0.5 rounded-full text-white text-[10.5px] font-bold"
              style={{
                backgroundColor: `var(--palette-${cat.color ?? 'blue'}-dark)`,
              }}>
              {cat.name}
            </span>
          </div>
        )}
        <div className="text-base font-bold text-ink-900 tracking-[-0.01em] truncate">
          {event.eventTitle}
        </div>
        <div className="flex gap-4 mt-1.5 text-[12.5px] text-ink-500 min-w-0">
          {time && (
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <MdOutlineAccessTime className="text-[13px]" /> {time}
            </span>
          )}
          {event.eventPlace && (
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <MdOutlinePlace className="text-[13px] shrink-0" />
              <span className="truncate">{event.eventPlace}</span>
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-royal whitespace-nowrap">
        {i18n.t('Details')} <MdChevronRight className="text-[15px]" />
      </span>
    </Link>
  );
}

// ---- Helpers ---- //

type MonthGroup = {key: string; label: string; events: ListEvent[]};

function groupByMonth(events: ListEvent[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();
  for (const event of events) {
    if (!event.eventStartDateTime) continue;
    const start = new Date(event.eventStartDateTime ?? '');
    const key = `${start.getFullYear()}-${start.getMonth()}`;
    let group = map.get(key);
    if (!group) {
      group = {key, label: monthLabel(start), events: []};
      map.set(key, group);
    }
    group.events.push(event);
  }
  return Array.from(map.values());
}

function monthLabel(date: Date): string {
  // Localized to the viewer via the shared dayjs formatter (client).
  return formatDate(date, {dateFormat: 'MMMM YYYY'}).toUpperCase();
}

function monthAbbrev(date: Date): string {
  return formatDate(date, {dateFormat: 'MMM'}).replace('.', '').toUpperCase();
}

function formatHHmm(date: Date): string {
  if (Number.isNaN(date.getTime())) return '';
  // Through the shared formatter for consistency with the rest of the app.
  return formatDate(date, {dateFormat: 'HH:mm'});
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildQuickRanges(): QuickRange[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const firstOfMonth = new Date(y, m, 1);
  const lastOfMonth = new Date(y, m + 1, 0);
  const lastOfThirdMonth = new Date(y, m + 3, 0);
  return [
    {
      key: 'this-month',
      label: i18n.t('This month'),
      from: toISODate(firstOfMonth),
      to: toISODate(lastOfMonth),
    },
    {
      key: 'next-3-months',
      label: i18n.t('Next 3 months'),
      from: toISODate(firstOfMonth),
      to: toISODate(lastOfThirdMonth),
    },
  ];
}
