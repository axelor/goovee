'use client';

import Image from 'next/image';
import {authClient} from '@/lib/auth-client';
import {
  MdArrowForward,
  MdOutlineCalendarToday,
  MdOutlinePlace,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {EventsConfig} from '@/subapps/events/common/orm/config';
import type {Cloned} from '@/types/util';
import {isCommentEnabled} from '@/comments';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {formatDate, formatDateTime} from '@/lib/core/locale/formatters';
import {InnerHTML} from '@/ui/components';
import {Link} from '@/ui/components/link';
import {withBasePath} from '@/lib/core/path/base-path';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {CommentsSection} from '@/subapps/events/common/ui/components';
import type {FullEvent} from '@/subapps/events/common/orm/event';
import {
  hasRegistrationEnded,
  isLoginNeededForRegistration,
} from '@/subapps/events/common/utils';

function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const start = new Date(date).getTime();
  if (Number.isNaN(start)) return null;
  const ms = start - Date.now();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// All date/time display goes through the shared dayjs formatter so it renders
// in the viewer's timezone AND locale (client-side), and stays consistent with
// the main date line (formatDateTime).
function dateParts(date: Date | string | null | undefined): {
  month: string;
  day: string;
} {
  if (!date) return {month: '—', day: '—'};
  const month = formatDate(date, {dateFormat: 'MMM'});
  const day = formatDate(date, {dateFormat: 'D'});
  if (!month || !day) return {month: '—', day: '—'};
  return {month: month.replace('.', '').toUpperCase(), day};
}

function timeOnly(date: Date | string | null | undefined): string {
  if (!date) return '';
  return formatDate(date, {dateFormat: 'HH:mm'});
}

export function EventDetails({
  eventDetails,
  config,
}: {
  eventDetails: Cloned<FullEvent>;
  config: EventsConfig | Cloned<EventsConfig>;
}) {
  const {workspaceURI} = useWorkspace();
  const {data: session} = authClient.useSession();
  const user = session?.user;

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.events,
    config,
  });

  const {
    formattedDefaultPriceAti,
    formattedDefaultPrice,
    defaultPrice,
    eventAllowRegistration,
    isRegistered,
  } = eventDetails || {};

  const allowGuestEventRegistration = config?.allowGuestEventRegistration;

  const allowGuests =
    allowGuestEventRegistration && !isLoginNeededForRegistration(eventDetails);

  const isRegistrationAllow =
    eventAllowRegistration &&
    (user || allowGuests) &&
    !hasRegistrationEnded(eventDetails);

  const category = eventDetails.eventCategorySet?.[0];
  const days = daysUntil(eventDetails.eventStartDateTime);
  const isFree = !defaultPrice || Number(defaultPrice) === 0;
  const startTime = timeOnly(eventDetails.eventStartDateTime);
  const endTime = timeOnly(eventDetails.eventEndDateTime);
  const {month, day} = dateParts(eventDetails.eventStartDateTime);

  const eventsRootHref = `${workspaceURI}/${SUBAPP_CODES.events}`;
  const registerHref = `${eventsRootHref}/${eventDetails?.slug}/register`;

  const heroImageURL = eventDetails.eventImage?.id
    ? withBasePath(
        `${workspaceURI}/${SUBAPP_CODES.events}/api/event/${eventDetails.slug}/image`,
      )
    : withBasePath(NO_IMAGE_URL);

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container mx-auto max-w-[1280px] px-4 md:px-8 py-6 pb-24 lg:pb-14">
        <Link
          href={eventsRootHref}
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-700 mb-4">
          ← {i18n.t('Back to events')}
        </Link>

        {/* Hero featured XL */}
        <section
          className="relative rounded-[20px] overflow-hidden border border-ink-100 shadow-soft-md mb-7"
          style={{height: 380}}>
          <Image
            src={heroImageURL}
            alt={eventDetails.eventTitle ?? ''}
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
            <div className="max-w-[640px] text-white">
              <div className="flex flex-wrap gap-2.5 mb-3.5">
                {category && (
                  <span
                    className="inline-flex items-center px-3 py-[5px] rounded-full text-white text-[11px] font-bold uppercase tracking-[0.04em]"
                    style={{
                      backgroundColor: `var(--palette-${category.color ?? 'blue'}-dark)`,
                    }}>
                    {category.name}
                  </span>
                )}
                {isFree && (
                  <span className="inline-flex items-center px-3 py-[5px] rounded-full bg-mint-500 text-white text-[11px] font-bold uppercase tracking-[0.04em]">
                    {i18n.t('Free')}
                  </span>
                )}
                {isRegistered && (
                  <span className="inline-flex items-center px-3 py-[5px] rounded-full bg-white/[0.18] border border-white/30 text-white text-[11px] font-bold uppercase tracking-[0.04em]">
                    {i18n.t('Registered')}
                  </span>
                )}
              </div>
              <h1
                className="m-0 text-[42px] font-extrabold tracking-[-0.025em] leading-[1.1]"
                style={{textShadow: '0 2px 12px rgba(0,0,0,0.4)'}}>
                {eventDetails.eventTitle}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-[18px] text-[14.5px] text-white/90">
                <span className="inline-flex items-center gap-1.5">
                  <MdOutlineCalendarToday className="text-base" />
                  {eventDetails.eventStartDateTime &&
                    formatDateTime(eventDetails.eventStartDateTime, {
                      dateFormat: 'LL',
                      timeFormat: ' · HH:mm',
                    })}
                  {endTime && (
                    <span className="tabular-nums text-white/85">
                      {' '}
                      – {endTime}
                    </span>
                  )}
                </span>
                {eventDetails.eventPlace && (
                  <span className="inline-flex items-center gap-1.5">
                    <MdOutlinePlace className="text-base" />
                    {eventDetails.eventPlace}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Countdown pill */}
          {days != null && days > 0 && (
            <div
              className="absolute top-6 right-6 px-[22px] py-3.5 rounded-2xl bg-white/95 text-royal-dark text-center backdrop-blur-[6px]"
              style={{boxShadow: '0 4px 14px rgba(13,30,75,0.18)'}}>
              <div className="text-[36px] leading-none font-extrabold text-royal tabular-nums">
                {days}
              </div>
              <div className="text-[10px] uppercase tracking-[0.1em] font-bold mt-1">
                {i18n.t('Days left')}
              </div>
            </div>
          )}
        </section>

        {/* 2-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-7 items-start">
          {/* Left column */}
          <div className="flex flex-col gap-[22px] min-w-0">
            {eventDetails.eventDescription && (
              <Section title={i18n.t('About this event')}>
                <InnerHTML
                  className="text-[15px] text-ink-800 leading-[1.7] [&_p]:my-0 [&_p+p]:mt-3"
                  content={eventDetails.eventDescription}
                />
              </Section>
            )}

            {eventDetails.eventPlace && (
              <Section title={i18n.t('Location')}>
                <div className="flex items-center gap-3">
                  <div className="w-[38px] h-[38px] rounded-[10px] bg-royal-pale text-royal grid place-items-center shrink-0">
                    <MdOutlinePlace className="text-lg" />
                  </div>
                  <div className="text-sm font-semibold text-ink-800">
                    {eventDetails.eventPlace}
                  </div>
                </div>
              </Section>
            )}

            {enableComment && (
              <Section title={i18n.t('Comments')}>
                <CommentsSection
                  eventId={eventDetails.id}
                  slug={eventDetails.slug}
                />
              </Section>
            )}
          </div>

          {/* Right column — sticky registration card */}
          <aside className="lg:sticky lg:top-5 flex flex-col gap-3.5">
            <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-soft-md">
              {/* Date callout */}
              <div
                className="text-white px-[22px] py-5 flex items-center gap-4"
                style={{
                  background:
                    'linear-gradient(135deg, hsl(var(--royal-dark)) 0%, hsl(var(--royal)) 100%)',
                }}>
                <div className="w-[70px] h-[70px] rounded-xl bg-white/[0.15] border border-white/20 flex flex-col items-center justify-center shrink-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.06em] opacity-85">
                    {month}
                  </div>
                  <div className="text-[28px] font-extrabold leading-none tabular-nums mt-0.5">
                    {day}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] opacity-85">
                    {i18n.t('Registration')}
                  </div>
                  <div className="text-[13px] text-white/90 mt-1 tabular-nums">
                    {startTime}
                    {endTime ? ` – ${endTime}` : ''}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-[22px]">
                <div className="mb-[18px]">
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-500">
                    {i18n.t('Price (incl. tax)')}
                  </div>
                  <div
                    className={cn(
                      'mt-0.5 text-[32px] font-extrabold tracking-[-0.02em] leading-[1.1] tabular-nums',
                      isFree ? 'text-mint-600' : 'text-ink-900',
                    )}>
                    {isFree ? i18n.t('Free') : formattedDefaultPriceAti}
                  </div>
                  {!isFree && formattedDefaultPrice && (
                    <div className="text-xs text-ink-500 mt-0.5 tabular-nums">
                      {formattedDefaultPrice} {i18n.t('excl. tax')}
                    </div>
                  )}
                </div>

                {isRegistrationAllow ? (
                  <Link
                    href={registerHref}
                    className="inline-flex w-full items-center justify-center gap-2 px-[18px] py-3.5 rounded-xl bg-mint-500 text-white text-[14.5px] font-bold transition-colors hover:bg-mint-600"
                    style={{
                      boxShadow:
                        '0 1px 2px rgba(46,163,107,0.3), 0 6px 14px rgba(46,163,107,0.18)',
                    }}>
                    {i18n.t('Register to event')}
                    <MdArrowForward className="text-base" />
                  </Link>
                ) : (
                  <div className="rounded-xl border border-ink-100 bg-ink-25 px-4 py-3 text-[13px] text-ink-600 text-center">
                    {hasRegistrationEnded(eventDetails)
                      ? i18n.t('Registration is closed')
                      : i18n.t('Sign in to register')}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-ink-100 shadow-xs p-6">
      <div className="mb-4">
        <h2 className="m-0 text-lg font-bold text-ink-900 tracking-[-0.015em]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 mb-0 text-[12.5px] text-ink-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
