import padStart from 'lodash/padStart';
import {i18n} from '@/locale/i18n';
import {l10n} from '@/locale/server/l10n';
import {DEFAULT_SCALE} from '@/locale/contants';
import {addCurrency} from '@/locale/utils';
import {Timezones} from '@/types/date';

/**
 * Numbers
 */

type NumberOpts = {
  scale?: string | number;
  currency?: string;
  type?: 'DECIMAL' | 'INTEGER';
  locale?: string;
};

export async function formatNumber(
  value?: string | number,
  {scale, currency, type, locale}: NumberOpts = {},
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
  const _l10n = await l10n(locale);
  const lang = _l10n.getLocale().split(/-|_/)[0];

  if (num === 0 || num) {
    const opts: Intl.NumberFormatOptions = {};
    opts.minimumFractionDigits = scale;
    opts.maximumFractionDigits = scale;
    if (currency) {
      opts.style = 'currency';
      opts.currency = currency;
    }
    try {
      return _l10n.formatNumber(num, opts);
    } catch (e) {
      // Fall back to adding currency symbol
      if (currency) {
        const result = _l10n.formatNumber(num, {
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

export async function formatInteger(value: string | number) {
  return formatNumber(value);
}

export async function formatPercent(
  value: string | number,
  {scale, locale}: Pick<NumberOpts, 'scale' | 'locale'> = {},
) {
  const num = +value;
  if (num === 0 || num) {
    const opts: Intl.NumberFormatOptions = {style: 'percent'};
    if (scale) {
      opts.minimumFractionDigits = +scale || DEFAULT_SCALE;
      opts.maximumFractionDigits = +scale || DEFAULT_SCALE;
    }

    const _l10n = await l10n(locale);
    return _l10n.formatNumber(num, opts);
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
  locale?: string;
  timezone?: Timezones;
};

export async function getDateFormat({
  dateFormat,
  locale,
}: Pick<DateTimeFormatOpts, 'dateFormat' | 'locale'> = {}) {
  const _l10n = await l10n(locale);
  return dateFormat || _l10n.getDateFormat();
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

export async function getDateTimeFormat(opts: DateTimeFormatOpts = {}) {
  const _dateFormat = await getDateFormat(opts);
  return _dateFormat + ' ' + getTimeFormat(opts);
}

export async function formatDate(
  value: string | Date,
  {
    dateFormat,
    locale,
    timezone,
  }: Pick<DateTimeFormatOpts, 'dateFormat' | 'locale' | 'timezone'> = {},
) {
  const format = await getDateFormat({dateFormat, locale});
  const _l10n = await l10n();
  const dayjs = _l10n.getDayjs();

  if (!value) return '';

  let date = dayjs(value);

  if (timezone) {
    date = date.tz(timezone);
  }

  return date.format(format);
}

export async function formatTime(
  value: string,
  opts: Pick<DateTimeFormatOpts, 'timeFormat' | 'seconds' | 'locale'> = {},
) {
  const format = getTimeFormat(opts);
  const _l10n = await l10n(opts.locale);
  const dayjs = _l10n.getDayjs();

  return value
    ? dayjs(value, [
        'YYYY-MM-DDTHH:mm:ss',
        'YYYY-MM-DDTHH:mm:ssZ[Z]',
        'HH:mm:ss',
        'HH:mm',
      ]).format(format)
    : '';
}

export async function formatDateTime(
  value: string | Date,
  opts: DateTimeFormatOpts = {},
) {
  const format = await getDateTimeFormat(opts);
  const _l10n = await l10n(opts.locale);
  const dayjs = _l10n.getDayjs();
  return value ? dayjs(value).format(format) : '';
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

export async function formatRelativeTime(
  value: string | Date,
  {type, locale}: Pick<DateTimeFormatOpts, 'type' | 'locale'> = {},
) {
  let result = '';

  if (!value) return '';
  const _l10n = await l10n(locale);
  const dayjs = _l10n.getDayjs();

  result = dayjs(value).fromNow();

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
};
