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
}: {
  date: string | Date | null | undefined;
  part: Part;
}) {
  if (!date) return <>{part === 'time' ? '' : '—'}</>;

  if (part === 'month') {
    const month = formatDate(date, {dateFormat: 'MMM'});
    return <>{month ? month.replace('.', '').toUpperCase() : '—'}</>;
  }

  if (part === 'day') {
    return <>{formatDate(date, {dateFormat: 'D'}) || '—'}</>;
  }

  // time
  return <>{formatDate(date, {dateFormat: 'HH:mm'})}</>;
}

export default EventLocalDate;
