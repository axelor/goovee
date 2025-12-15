import padStart from 'lodash/padStart';
import {i18n} from '@/locale/i18n';
import {dayjs, l10n} from '@/locale/l10n';
import {DEFAULT_SCALE} from '@/locale/contants';
import {addCurrency} from '@/locale/utils';

/**
 * Numbers
 */

type NumberOpts = {
  scale?: string | number;
  currency?: string;
  type?: 'DECIMAL' | 'INTEGER';
};

export function formatNumber(
  value: string | number,
  {scale, currency, type}: NumberOpts = {},
) {
  if (value === null || value === undefined) {
    return value;
  }

  if (type === 'DECIMAL') {
    if (typeof scale === 'string') {
      scale = +scale;
    }

    if (typeof scale !== 'number' && scale !== undefined && isNaN(scale)) {
      scale = DEFAULT_SCALE;
    }
  } else {
    scale = 0;
  }

  const num = +value;
  const lang = l10n.getLocale().split(/-|_/)[0];

  if (num === 0 || num) {
    const opts: Intl.NumberFormatOptions = {};
    opts.minimumFractionDigits = scale;
    opts.maximumFractionDigits = scale;
    if (currency) {
      opts.style = 'currency';
      opts.currency = currency;
    }
    try {
      return l10n.formatNumber(num, opts);
    } catch (e) {
      // Fall back to adding currency symbol
      if (currency) {
        const result = l10n.formatNumber(num, {
          minimumFractionDigits: opts.minimumFractionDigits,
          maximumFractionDigits: opts.maximumFractionDigits,
        });
        return addCurrency(result, currency, lang);
      }
      throw e;
    }
  }

  if (typeof value === 'string' && currency) {
    return addCurrency(value, currency, lang);
  }

  return value;
}

export function formatInteger(value: string | number) {
  return formatNumber(value);
}

export function formatPercent(
  value: string | number,
  {scale}: Pick<NumberOpts, 'scale'> = {},
) {
  const num = +value;
  if (num === 0 || num) {
    const opts: Intl.NumberFormatOptions = {style: 'percent'};
    if (scale) {
      opts.minimumFractionDigits = +scale || DEFAULT_SCALE;
      opts.maximumFractionDigits = +scale || DEFAULT_SCALE;
    }
    return l10n.formatNumber(num, opts);
  }

  return value;
}

export function formatBoolean(value: boolean) {
  return Boolean(value).toString();
}

/**
 * DateTime
 */

type DateTimeFormatOpts = {
  dateFormat?: string;
  timeFormat?: string;
  seconds?: boolean;
  type?: 'DATE';
  big?: boolean;
};

export function getDateFormat({
  dateFormat,
}: Pick<DateTimeFormatOpts, 'dateFormat'> = {}) {
  return dateFormat || l10n.getDateFormat();
}

export function getTimeFormat({
  timeFormat,
  seconds,
}: Pick<DateTimeFormatOpts, 'timeFormat' | 'seconds'> = {}) {
  if (timeFormat) return timeFormat;
  let format = 'HH:mm';
  if (seconds) {
    format += ':ss';
  }
  return format;
}

export function getDateTimeFormat(opts: DateTimeFormatOpts = {}) {
  const _dateFormat = getDateFormat(opts);
  return _dateFormat + ' ' + getTimeFormat(opts);
}

export function formatDate(
  value: string | Date,
  {dateFormat}: Pick<DateTimeFormatOpts, 'dateFormat'> = {},
) {
  const format = getDateFormat({dateFormat});

  const standardized = standardizeDate(value);
  return standardized ? dayjs(standardized).format(format) : '';
}

export function formatTime(
  value: string,
  opts: Pick<DateTimeFormatOpts, 'timeFormat' | 'seconds'> = {},
) {
  const format = getTimeFormat(opts);
  return value
    ? dayjs(value, [
        'YYYY-MM-DDTHH:mm:ss',
        'YYYY-MM-DDTHH:mm:ssZ[Z]',
        'HH:mm:ss',
        'HH:mm',
      ]).format(format)
    : '';
}

export function formatDateTime(
  value: string | Date,
  opts: DateTimeFormatOpts = {},
) {
  const format = getDateTimeFormat(opts);

  const standardized = standardizeDate(value);
  return standardized ? dayjs(standardized).format(format) : '';
}

export function formatDuration(
  value?: string | number,
  {big, seconds}: Pick<DateTimeFormatOpts, 'big' | 'seconds'> = {},
) {
  if ((!value && value !== 0) || isNaN(+value)) {
    return value;
  }

  value = Number(value);

  let h = '' + Math.floor(value / 3600);
  let m = '' + Math.floor((value % 3600) / 60);
  let s = '' + Math.floor((value % 3600) % 60);

  h = padStart(h, big ? 3 : 2, '0');
  m = padStart(m, 2, '0');
  s = padStart(s, 2, '0');

  let text = h + ':' + m;

  if (seconds) {
    text = text + ':' + s;
  }

  return text;
}

export function formatRelativeTime(
  value: string | Date,
  {type}: Pick<DateTimeFormatOpts, 'type'> = {},
) {
  let result = '';

  if (!value) return '';

  const standardized = standardizeDate(value);

  result = dayjs(standardized).fromNow();

  if (type === 'DATE') {
    result = dayjs(value).calendar(null, {
      sameDay: `[${i18n.t('Today')}]`,
      nextDay: `[${i18n.t('Tomorrow')}]`,
      nextWeek: 'dddd',
      lastDay: `[${i18n.t('Yesterday')}]`,
      lastWeek: i18n.t('[Last] dddd'),
      sameElse: `[${result}]`,
    });
  }

  return result[0].toLocaleUpperCase() + result.slice(1);
}

export function standardizeDate(value: Date | string): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;

  const date = value.includes('T')
    ? new Date(value)
    : new Date(
        new Date(value).getUTCFullYear(),
        new Date(value).getUTCMonth(),
        new Date(value).getUTCDate(),
      );

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export const formatters = {
  formatNumber,
  formatInteger,
  formatPercent,
  formatBoolean,
  formatDate,
  formatTime,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
  standardizeDate,
};

export default formatters;
