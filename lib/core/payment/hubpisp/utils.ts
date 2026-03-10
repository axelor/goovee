import crypto from 'crypto';

export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Formats a timestamp as YYYY-MM-DDTHH:mm:ss.SSS+HH:MM in Europe/Paris timezone.
 * The HUB PISP API rejects UTC ("Z") dates — it requires a local offset.
 */
export function buildParisISOString(timestampMs: number): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const date = new Date(timestampMs);

  // Extract date/time components in Paris timezone
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map(p => [p.type, p.value]),
  );
  const hour = Number(parts.hour) % 24; // guard against "24" at midnight

  // Derive the offset: reconstruct the Paris wall-clock as UTC epoch, diff against actual UTC
  const parisWallMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  );
  // Strip sub-minute precision from both sides before dividing to avoid rounding errors
  const offsetMinutes =
    Math.floor(parisWallMs / 60_000) - Math.floor(date.getTime() / 60_000);

  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOff = Math.abs(offsetMinutes);
  const offH = pad(Math.floor(absOff / 60));
  const offM = pad(absOff % 60);

  return (
    `${parts.year}-${parts.month}-${parts.day}` +
    `T${pad(hour)}:${parts.minute}:${parts.second}.${pad(date.getMilliseconds(), 3)}` +
    `${sign}${offH}:${offM}`
  );
}

export function getDateHeader(): string {
  return new Date().toUTCString();
}

export function buildRequestTarget(
  method: 'post' | 'get',
  path: string,
): string {
  return `${method} ${path}`;
}
