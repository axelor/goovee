'use client';

import {
  MdArrowBack,
  MdCalendarMonth,
  MdCheck,
  MdOutlinePlace,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {formatDateTime} from '@/lib/core/locale/formatters';
import {cn} from '@/utils/css';
import type {Cloned} from '@/types/util';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import type {FullEvent} from '@/subapps/events/common/orm/event';

type ContentProps = {
  event: Cloned<FullEvent>;
};

function Content({event}: ContentProps) {
  const {workspaceURI} = useWorkspace();
  const category = event?.eventCategorySet?.[0];
  const eventsRootHref = `${workspaceURI}/${SUBAPP_CODES.events}`;

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container mx-auto max-w-[720px] px-4 md:px-8 py-10 pb-14">
        {/* Success card */}
        <section className="bg-white border border-ink-100 rounded-[20px] overflow-hidden shadow-soft-md">
          {/* Banner gradient mint */}
          <div
            className="relative overflow-hidden text-white text-center px-8 pt-9 pb-8"
            style={{
              background: `
                radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 50%),
                linear-gradient(135deg, hsl(var(--mint-500)) 0%, hsl(var(--mint-700)) 100%)
              `,
            }}>
            {/* Decorative SVG pattern */}
            <svg
              viewBox="0 0 600 200"
              preserveAspectRatio="none"
              aria-hidden
              className="absolute inset-0 w-full h-full opacity-[0.18]">
              <g stroke="#fff" strokeWidth="1" fill="none">
                <circle cx="80" cy="40" r="22" />
                <circle cx="520" cy="50" r="14" />
                <circle cx="80" cy="160" r="10" />
                <circle cx="520" cy="160" r="22" />
                <path d="M40,100 L60,90 L60,110 Z" />
                <path d="M540,100 L560,90 L560,110 Z" />
              </g>
            </svg>

            <div
              className="relative inline-grid place-items-center w-[72px] h-[72px] rounded-full mb-4"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '2px solid rgba(255,255,255,0.4)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}>
              <MdCheck className="text-white" style={{fontSize: 36}} />
            </div>
            <h1 className="relative m-0 text-[26px] font-extrabold tracking-[-0.02em] leading-[1.2]">
              {i18n.t('Registration confirmed!')}
            </h1>
            <p className="relative m-0 mt-2 text-[14.5px] text-white/[0.92]">
              {i18n.t('A confirmation email has just been sent to you.')}
            </p>
          </div>

          {/* Event info */}
          <div className="px-8 py-[26px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-500 mb-2">
              {i18n.t('You are registered for')}
            </div>
            <h2 className="m-0 mb-3.5 text-[22px] font-bold tracking-[-0.015em] text-ink-900 leading-[1.25]">
              {event?.eventTitle}
            </h2>
            <div className="flex items-center gap-2.5 mb-3.5 text-sm text-ink-700 font-semibold">
              <MdCalendarMonth className="text-royal text-[15px] shrink-0" />
              <span>
                {event?.eventStartDateTime &&
                  formatDateTime(event.eventStartDateTime, {
                    dateFormat: 'MMMM D YYYY',
                    timeFormat: ' · h:mmA',
                  })}
                {event?.eventEndDateTime && (
                  <>
                    {' '}
                    <span className="font-medium text-ink-500">
                      {i18n.t('to')}
                    </span>{' '}
                    {formatDateTime(event.eventEndDateTime, {
                      dateFormat: 'MMMM D YYYY',
                      timeFormat: ' · h:mmA',
                    })}
                  </>
                )}
              </span>
            </div>
            {event?.eventPlace && (
              <div className="inline-flex items-center gap-2.5 text-[13px] text-ink-600">
                <MdOutlinePlace className="text-ink-400 text-sm shrink-0" />
                {event.eventPlace}
              </div>
            )}
            {category && (
              <div className="mt-3">
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-white text-[11px] font-bold uppercase tracking-[0.04em]"
                  style={{
                    backgroundColor: `var(--palette-${category.color ?? 'blue'}-dark)`,
                  }}>
                  {category.name}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Back to homepage */}
        <Link
          href={eventsRootHref}
          className={cn(
            'w-full mt-[18px] inline-flex items-center justify-center gap-2',
            'px-[18px] py-3.5 rounded-xl bg-white text-mint-700',
            'border border-mint-200 text-sm font-bold',
            'hover:bg-mint-50 transition-colors',
          )}>
          <MdArrowBack className="text-sm" />
          {i18n.t('Back to homepage')}
        </Link>
      </div>
    </div>
  );
}

export default Content;
