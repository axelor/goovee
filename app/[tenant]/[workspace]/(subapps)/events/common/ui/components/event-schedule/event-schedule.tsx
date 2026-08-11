'use client';

// ---- CORE IMPORTS ---- //
import {MdOutlineCalendarToday, MdOutlineSchedule} from 'react-icons/md';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {EventLocalDate} from '@/subapps/events/common/ui/components/event-local-date';
import {
  formatEventSchedule,
  isMultiDayEvent,
} from '@/subapps/events/common/utils/schedule';

/**
 * Renders when an event happens next to a card that already shows its start
 * date, in the VIEWER's timezone and locale. Both the text and the multi-day
 * test run on the client: whether an event spans two calendar days depends on
 * the timezone reading it, so a server component would answer for the server.
 *
 * A multi-day event shows its date span, since the start and end clock times
 * sit on different days and say nothing about the days between. A single-day
 * event shows its times, unless it runs all day, in which case it shows
 * nothing.
 *
 * The three dates are taken as separate props rather than the event they come
 * from: a server component serializes whatever it passes, and an event carries
 * a description and a registration list that no caller of this renders.
 */
export function EventSchedule({
  startDateTime,
  endDateTime,
  allDay,
  className,
  iconClassName,
}: {
  startDateTime: Date | string | null;
  endDateTime: Date | string | null;
  allDay: boolean | null;
  className?: string;
  iconClassName?: string;
}) {
  const event = {
    eventStartDateTime: startDateTime,
    eventEndDateTime: endDateTime,
    eventAllDay: allDay,
  };

  if (isMultiDayEvent(event)) {
    return (
      <span className={cn('inline-flex items-center', className)}>
        <MdOutlineCalendarToday className={iconClassName} />
        <span className="tabular-nums">{formatEventSchedule(event)}</span>
      </span>
    );
  }

  if (event.eventAllDay) return null;

  return (
    <span className={cn('inline-flex items-center', className)}>
      <MdOutlineSchedule className={iconClassName} />
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
  );
}
