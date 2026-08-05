'use client';

// ---- CORE IMPORTS ---- //
import {formatDate} from '@/locale/formatters';

type Part = 'month' | 'day' | 'time';

/**
 * Renders a single date part in the VIEWER's timezone and locale — formatting
 * runs on the client through the shared dayjs formatter. Server components must
 * not format dates directly (they'd render in the server's timezone/locale,
 * the exact defect #103225 fixed).
 */
export function EventLocalDate({
  date,
  part,
  allDay = false,
}: {
  date: string | Date | null | undefined;
  part: Part;
  // All-day events have no meaningful clock time; rendering it shows "00:00".
  allDay?: boolean;
}) {
  if (!date) return <>{part === 'time' ? '' : '—'}</>;

  if (part === 'month') {
    const month = formatDate(date, {dateFormat: 'MMM'});
    return <>{month ? month.replace('.', '').toUpperCase() : '—'}</>;
  }

  if (part === 'day') {
    return <>{formatDate(date, {dateFormat: 'D'}) || '—'}</>;
  }

  // time — suppressed for all-day events (no phantom 00:00)
  if (allDay) return <></>;
  return <>{formatDate(date, {dateFormat: 'HH:mm'})}</>;
}
