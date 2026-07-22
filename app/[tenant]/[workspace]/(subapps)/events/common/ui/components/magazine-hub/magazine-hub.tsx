'use client';

import {useEffect, useMemo, useState} from 'react';
import Image from 'next/image';
import {
  MdArrowForward,
  MdCheckCircle,
  MdFilterList,
  MdFormatListBulleted,
  MdOutlineCalendarToday,
  MdOutlinePlace,
  MdSearch,
} from 'react-icons/md';

import {i18n} from '@/locale';
import {Button, InnerHTML} from '@/ui/components';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {formatDateTime} from '@/locale/formatters';
import {cn} from '@/utils/css';
import {Link} from '@/ui/components/link';
import {withBasePath} from '@/lib/core/path/base-path';
import type {ListEvent} from '@/subapps/events/common/orm/event';

export interface MagazineHubLabels {
  title: string;
  upcomingDates: string;
  upcomingDate: string;
  pastCount: string;
  registerNow: string;
  daysLabel: string;
  upcomingHeading: string;
  emptyActive: string;
  emptyPast: string;
  seeLabel: string;
  freeLabel: string;
  agendaView: string;
  filtersLabel: string;
  activeTab: string;
  pastTab: string;
  featuredBadge: string;
  replayBadge: string;
  registeredBadge: string;
  pastCta: string;
  replayHeading: string;
  categoryLabel: string;
  clearAllLabel: string;
}

type Tab = 'active' | 'past';

export interface MagazineHubCategory {
  id: string;
  name: string | null;
  color?: string | null;
}

export function MagazineHub({
  activeEvents,
  pastEvents,
  categories,
  workspaceURI,
  workspaceURL,
  labels,
  searchAction,
}: {
  activeEvents: ListEvent[];
  pastEvents: ListEvent[];
  categories: MagazineHubCategory[];
  workspaceURI: string;
  workspaceURL: string;
  labels: MagazineHubLabels;
  searchAction: (args: {
    search: string;
    workspaceURL: string;
  }) => Promise<ListEvent[]>;
}) {
  const [tab, setTab] = useState<Tab>('active');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());

  // Global event search (ORM, like before the redesign) — dropdown of matches.
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ListEvent[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const hasQuery = search.trim().length >= 2;

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const handle = setTimeout(() => {
      searchAction({search: q, workspaceURL})
        .then(res => {
          if (active) setSearchResults(res);
        })
        .catch(() => {
          if (active) setSearchResults([]);
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [search, searchAction, workspaceURL]);

  const isPast = tab === 'past';
  const rawSource = isPast ? pastEvents : activeEvents;
  const hasFilters = activeCats.size > 0;

  const source = useMemo(() => {
    if (!hasFilters) return rawSource;
    return rawSource.filter(e =>
      (e.eventCategorySet ?? []).some(c => activeCats.has(String(c.id))),
    );
  }, [rawSource, activeCats, hasFilters]);

  const featured = source[0] ?? null;
  const grid = source.slice(1);

  const agendaHref = `${workspaceURI}/${SUBAPP_CODES.events}/calendar`;

  const toggleCat = (id: string) => {
    setActiveCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => setActiveCats(new Set());

  return (
    <div className="py-8 container mx-auto max-w-[1280px]">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-[32px] font-extrabold text-ink-900 tracking-[-0.025em] leading-tight">
          {labels.title}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {activeEvents.length}{' '}
          {activeEvents.length > 1 ? labels.upcomingDates : labels.upcomingDate}{' '}
          · {pastEvents.length} {labels.pastCount}
        </p>
      </header>

      {/* Tabs Actifs / Passés */}
      <div className="inline-flex gap-1.5 border-b border-ink-100 mb-6">
        {[
          {
            key: 'active' as const,
            label: labels.activeTab,
            count: activeEvents.length,
          },
          {
            key: 'past' as const,
            label: labels.pastTab,
            count: pastEvents.length,
          },
        ].map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'inline-flex items-center gap-2 px-1 py-3 text-[14.5px] font-bold border-b-[2.5px] -mb-px transition-colors',
                active
                  ? 'border-royal text-ink-900'
                  : 'border-transparent text-ink-500 hover:text-ink-700',
              )}>
              {t.label}
              <span
                className={cn(
                  'min-w-[22px] h-[22px] px-1.5 rounded-full inline-grid place-items-center text-[11px] font-extrabold tabular-nums',
                  active ? 'bg-royal text-white' : 'bg-ink-100 text-ink-600',
                )}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        {/* Search */}
        <div className="relative w-full sm:max-w-[360px]">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-royal text-lg" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            placeholder={i18n.t('Search an event')}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-royal-pale/60 border border-royal-border text-sm text-ink-800 placeholder:text-ink-400 outline-none focus:border-royal focus:bg-royal-pale focus:shadow-[0_0_0_3px_rgba(21,84,181,0.12)] transition"
          />
          {searching && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-ink-400">
              {i18n.t('Searching…')}
            </span>
          )}
          {hasQuery && searchOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setSearchOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white border border-ink-100 rounded-xl shadow-soft-md overflow-hidden">
                {searchResults.length === 0 ? (
                  !searching && (
                    <div className="px-4 py-4 text-[13px] text-ink-400">
                      {i18n.t('No events found')}
                    </div>
                  )
                ) : (
                  <ul className="max-h-[340px] overflow-y-auto py-1">
                    {searchResults.map(event => (
                      <li key={event.id}>
                        <Link
                          href={`${workspaceURI}/${SUBAPP_CODES.events}/${event.slug}`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-ink-25 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="text-[13.5px] font-semibold text-ink-900 truncate">
                              {event.eventTitle}
                            </div>
                            <div className="flex items-center gap-2 text-[11.5px] text-ink-500 mt-0.5">
                              {event.eventStartDateTime && (
                                <span className="tabular-nums">
                                  {formatDateTime(
                                    event.eventStartDateTime ?? '',
                                    {
                                      dateFormat: 'LL',
                                    },
                                  )}
                                </span>
                              )}
                              {event.eventCategorySet?.[0]?.name && (
                                <>
                                  <span className="text-ink-300">·</span>
                                  <span
                                    className="inline-flex items-center px-2 py-px rounded-full text-white text-[10px] font-bold"
                                    style={{
                                      backgroundColor: `var(--palette-${
                                        event.eventCategorySet[0].color ??
                                        'blue'
                                      }-dark)`,
                                    }}>
                                    {event.eventCategorySet[0].name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <MdArrowForward className="text-ink-300 text-sm shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 shrink-0">
          <Button asChild variant="ink-outline" size="sm" className="gap-1.5">
            <Link href={agendaHref}>
              <MdFormatListBulleted className="text-base" />
              {labels.agendaView}
            </Link>
          </Button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen(o => !o)}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm font-medium transition-colors',
                filterOpen || hasFilters
                  ? 'bg-royal-pale text-royal-dark border-royal-border'
                  : 'bg-white text-ink-700 border-ink-150 hover:bg-ink-25',
              )}>
              <MdFilterList className="text-base" />
              {labels.filtersLabel}
              {hasFilters && (
                <span className="ml-1 inline-grid place-items-center min-w-[18px] h-[18px] px-[5px] rounded-full bg-royal text-white text-[11px] font-extrabold tabular-nums">
                  {activeCats.size}
                </span>
              )}
            </button>

            {filterOpen && (
              <>
                {/* Click-out backdrop */}
                <div
                  onClick={() => setFilterOpen(false)}
                  className="fixed inset-0 z-10"
                />
                {/* Popover */}
                <div
                  className="absolute top-full right-0 mt-2 w-[280px] z-20 bg-white border border-ink-100 rounded-xl overflow-hidden"
                  style={{
                    boxShadow:
                      '0 4px 14px rgba(13,30,75,0.12), 0 12px 32px rgba(13,30,75,0.10)',
                  }}>
                  <div className="flex items-center justify-between px-3.5 py-3 border-b border-ink-100">
                    <span className="text-xs font-extrabold uppercase tracking-[0.06em] text-ink-700">
                      {labels.categoryLabel}
                    </span>
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-[11.5px] font-bold text-royal hover:text-royal-dark">
                        {labels.clearAllLabel}
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 max-h-[280px] overflow-y-auto">
                    {categories.map(c => {
                      const on = activeCats.has(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[13px] text-ink-800 hover:bg-ink-25">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggleCat(c.id)}
                            className="w-4 h-4 cursor-pointer flex-shrink-0 accent-royal"
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0"
                            style={{
                              backgroundColor: `var(--palette-${c.color ?? 'blue'}-dark)`,
                            }}
                          />
                          <span
                            className={cn(
                              'flex-1',
                              on ? 'font-semibold' : 'font-medium',
                            )}>
                            {c.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Featured */}
      {featured ? (
        <FeaturedCard
          event={featured}
          workspaceURI={workspaceURI}
          ctaLabel={isPast ? labels.pastCta : labels.registerNow}
          daysLabel={labels.daysLabel}
          badgeLabel={isPast ? labels.replayBadge : labels.featuredBadge}
          registeredBadge={labels.registeredBadge}
          isPast={isPast}
        />
      ) : (
        <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-12 text-center">
          <p className="text-base font-semibold text-ink-700">
            {isPast ? labels.emptyPast : labels.emptyActive}
          </p>
        </div>
      )}

      {/* Grid */}
      {grid.length > 0 && (
        <section className="mt-8">
          <h2 className="m-0 mb-[18px] text-[22px] font-bold tracking-[-0.02em] text-ink-900">
            {isPast ? labels.replayHeading : labels.upcomingHeading}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
            {grid.map(event => (
              <MagazineCard
                key={event.id}
                event={event}
                workspaceURI={workspaceURI}
                seeLabel={labels.seeLabel}
                freeLabel={labels.freeLabel}
                registeredBadge={labels.registeredBadge}
                isPast={isPast}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---- Helpers ---- //

function getEventImageURL(event: ListEvent, workspaceURI: string): string {
  if (!event) return withBasePath(NO_IMAGE_URL);
  const categoryWithImage = event.eventCategorySet?.find(
    cat => cat.thumbnailImage?.id || cat.image?.id,
  );
  if (categoryWithImage) {
    return withBasePath(
      `${workspaceURI}/${SUBAPP_CODES.events}/api/category/${categoryWithImage.id}/image/${categoryWithImage.thumbnailImage?.id || categoryWithImage.image?.id}`,
    );
  }
  if (event.eventImage?.id) {
    return withBasePath(
      `${workspaceURI}/${SUBAPP_CODES.events}/api/event/${event.slug}/image`,
    );
  }
  return withBasePath(NO_IMAGE_URL);
}

function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null;
  const start = new Date(date).getTime();
  if (Number.isNaN(start)) return null;
  const now = Date.now();
  const ms = start - now;
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function getPrice(event: ListEvent): {value: number; display: string | null} {
  const raw = event?.defaultPrice ?? event?.eventProduct?.salePrice;
  if (raw == null) return {value: 0, display: null};
  const num = Number(raw);
  if (Number.isNaN(num)) return {value: 0, display: null};
  const symbol = event?.eventProduct?.saleCurrency?.symbol ?? '€';
  return {value: num, display: `${num.toFixed(2)} ${symbol}`};
}

function FeaturedCard({
  event,
  workspaceURI,
  ctaLabel,
  daysLabel,
  badgeLabel,
  registeredBadge,
  isPast,
}: {
  event: ListEvent;
  workspaceURI: string;
  ctaLabel: string;
  daysLabel: string;
  badgeLabel: string;
  registeredBadge: string;
  isPast: boolean;
}) {
  const imageURL = getEventImageURL(event, workspaceURI);
  const days = daysUntil(event.eventStartDateTime);
  const category = event.eventCategorySet?.[0];
  const detailHref = `${workspaceURI}/${SUBAPP_CODES.events}/${event.slug}`;

  return (
    <Link
      href={detailHref}
      className="group relative block rounded-[20px] overflow-hidden border border-ink-100 shadow-soft-md transition-transform hover:-translate-y-0.5"
      style={{height: 380, filter: isPast ? 'grayscale(0.2)' : 'none'}}>
      <Image
        src={imageURL}
        alt={event.eventTitle ?? ''}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 1216px, 100vw"
        priority
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(14,28,52,0.88) 0%, rgba(14,28,52,0.5) 50%, transparent 100%)',
        }}
      />
      <div className="absolute inset-0 flex items-center px-6 md:px-14">
        <div className="max-w-xl text-white">
          <div className="flex flex-wrap gap-2.5 mb-3.5">
            {event.isRegistered && (
              <span className="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-full bg-mint-500 text-white text-[11px] font-extrabold uppercase tracking-[0.08em]">
                <MdCheckCircle className="text-[13px]" />
                {registeredBadge}
              </span>
            )}
            <span
              className={cn(
                'inline-flex items-center px-3 py-[5px] rounded-full text-[11px] font-extrabold uppercase tracking-[0.08em]',
                isPast
                  ? 'bg-white/[0.18] text-white border border-white/30'
                  : 'bg-white text-royal-dark',
              )}>
              {badgeLabel}
            </span>
            {category && (
              <span
                className="inline-flex items-center px-3 py-[5px] rounded-full text-white text-[11px] font-bold uppercase tracking-[0.04em]"
                style={{
                  backgroundColor: `var(--palette-${category.color ?? 'blue'}-dark)`,
                }}>
                {category.name}
              </span>
            )}
          </div>
          <h2
            className="m-0 text-[38px] font-extrabold tracking-[-0.025em] leading-[1.15]"
            style={{textShadow: '0 2px 12px rgba(0,0,0,0.4)'}}>
            {event.eventTitle}
          </h2>
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-[14.5px] text-white/90">
            <MdOutlineCalendarToday className="text-base" />
            {formatDateTime(event.eventStartDateTime ?? '', {
              dateFormat: 'LL',
              timeFormat: ' · HH:mm',
            })}
            {event.eventPlace && (
              <>
                <span className="text-white/50">·</span>
                <MdOutlinePlace className="text-base" />
                {event.eventPlace}
              </>
            )}
          </div>
          {event.eventDescription && (
            <div
              className="mt-4 mb-5 text-[14.5px] text-white/85 line-clamp-2"
              style={{lineHeight: 1.55}}>
              <InnerHTML
                content={String(event.eventDescription).replace(
                  /<[^>]+>/g,
                  ' ',
                )}
              />
            </div>
          )}
          <span
            className={cn(
              'inline-flex items-center gap-2 px-[22px] py-3 rounded-xl text-sm font-bold shadow-soft-sm',
              isPast ? 'bg-white text-royal-dark' : 'bg-mint-500 text-white',
            )}>
            {ctaLabel}
            <MdArrowForward className="text-base" />
          </span>
        </div>
      </div>
      {!isPast && days != null && (
        <div
          className="absolute top-6 right-6 px-[18px] py-2.5 rounded-[14px] bg-white/95 text-royal-dark text-center backdrop-blur-[6px]"
          style={{boxShadow: '0 4px 14px rgba(0,0,0,0.12)'}}>
          <div className="text-[28px] leading-none font-extrabold text-royal tabular-nums">
            {days}
          </div>
          <div className="text-[10px] uppercase tracking-[0.1em] font-bold mt-0.5">
            {daysLabel}
          </div>
        </div>
      )}
    </Link>
  );
}

function MagazineCard({
  event,
  workspaceURI,
  seeLabel,
  freeLabel,
  registeredBadge,
  isPast,
}: {
  event: ListEvent;
  workspaceURI: string;
  seeLabel: string;
  freeLabel: string;
  registeredBadge: string;
  isPast: boolean;
}) {
  const imageURL = getEventImageURL(event, workspaceURI);
  const days = daysUntil(event.eventStartDateTime);
  const category = event.eventCategorySet?.[0];
  const detailHref = `${workspaceURI}/${SUBAPP_CODES.events}/${event.slug}`;
  const price = getPrice(event);

  return (
    <Link
      href={detailHref}
      className={cn(
        'group bg-white border border-ink-100 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-[3px] hover:shadow-soft-md flex flex-col',
        isPast && 'opacity-[0.78]',
      )}
      style={isPast ? {filter: 'grayscale(0.2)'} : undefined}>
      <div className="relative aspect-[16/9] bg-ink-50">
        <Image
          src={imageURL}
          alt={event.eventTitle ?? ''}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
        />
        {category && (
          <span
            className="absolute top-3.5 left-3.5 inline-flex items-center px-2.5 py-1 rounded-full text-white text-[11px] font-bold uppercase tracking-[0.04em]"
            style={{
              backgroundColor: `var(--palette-${category.color ?? 'blue'}-dark)`,
            }}>
            {category.name}
          </span>
        )}
        {!isPast && days != null && (
          <span className="absolute top-3 right-3 px-3 py-1.5 rounded-[10px] bg-white/95 text-royal-dark text-[11px] font-bold uppercase tracking-[0.04em]">
            J−{days}
          </span>
        )}
        {event.isRegistered && (
          <span className="absolute bottom-3 left-3.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-mint-500 text-white text-[11px] font-bold uppercase tracking-[0.04em] shadow-soft-sm">
            <MdCheckCircle className="text-[12px]" />
            {registeredBadge}
          </span>
        )}
      </div>
      <div className="p-[18px] flex flex-col gap-3 flex-1">
        <h3 className="m-0 text-base font-bold text-ink-900 tracking-[-0.01em] leading-snug line-clamp-2">
          {event.eventTitle}
        </h3>
        <div className="flex flex-col gap-1 text-[12.5px] text-ink-600">
          <div className="flex items-center gap-1.5">
            <MdOutlineCalendarToday className="text-ink-400 text-sm" />
            {formatDateTime(event.eventStartDateTime ?? '', {
              dateFormat: 'LL',
              timeFormat: ' · HH:mm',
            })}
          </div>
          {event.eventPlace && (
            <div className="flex items-center gap-1.5">
              <MdOutlinePlace className="text-ink-400 text-sm" />
              {event.eventPlace}
            </div>
          )}
        </div>
        {!isPast && (
          <div className="mt-auto pt-3 border-t border-ink-100 flex items-center justify-between">
            <span
              className={cn(
                'text-[13px] font-bold tabular-nums',
                price.value === 0 ? 'text-mint-600' : 'text-ink-900',
              )}>
              {price.value === 0 ? freeLabel : (price.display ?? freeLabel)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-royal">
              {seeLabel}
              <MdArrowForward className="text-xs" />
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
