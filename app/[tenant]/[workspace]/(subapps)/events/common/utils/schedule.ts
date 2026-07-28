// ---- CORE IMPORTS ---- //
import {
  formatDate,
  formatDateRange,
  formatDateTime,
  standardizeDate,
} from '@/locale/formatters';
import {isSameDay} from '@/utils/date';

type EventDates = {
  eventStartDateTime: Date | string | null;
  eventEndDateTime: Date | string | null;
  eventAllDay: boolean | null;
};

export function isMultiDayEvent(event: EventDates): boolean {
  const {eventStartDateTime, eventEndDateTime} = event;

  if (!eventStartDateTime || !eventEndDateTime) return false;

  const start = standardizeDate(eventStartDateTime);
  const end = standardizeDate(eventEndDateTime);

  return start != null && end != null && !isSameDay(start, end);
}

/* A multi-day event reads as a date range with the parts both ends share
 * collapsed, and without clock times: an event carries only an overall start
 * and end, so "14:00 – 18:00" across three days asserts one continuous session
 * rather than the daily schedule it actually has. A single-day event keeps its
 * start time unless it runs all day. */
export function formatEventSchedule(event: EventDates): string {
  const {eventStartDateTime, eventEndDateTime, eventAllDay} = event;

  if (!eventStartDateTime) return '';

  if (eventEndDateTime && isMultiDayEvent(event)) {
    return formatDateRange(eventStartDateTime, eventEndDateTime);
  }

  return eventAllDay
    ? formatDate(eventStartDateTime, {dateFormat: 'LL'})
    : formatDateTime(eventStartDateTime, {
        dateFormat: 'LL',
        timeFormat: ' · HH:mm',
      });
}
