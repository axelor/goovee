import {headers} from 'next/headers';
import {getSession} from '@/auth';
import {DEFAULT_DATE_FORMAT, DEFAULT_LOCALE} from '@/locale';
import {limitScale, transformLocale} from '@/locale/utils';

import {
  dayjs,
  findDateFormat,
  findDayjsLocale,
  type Dayjs,
} from '@/locale/dayjs';

async function initDayjs(locale: string) {
  const data = await findDayjsLocale(locale);
  return {
    dayjs: (...args: any): Dayjs => dayjs(...args).locale(data),
    dayjsLocale: data,
  };
}

export async function l10n(l?: string) {
  let dateFormat = DEFAULT_DATE_FORMAT;

  const session = await getSession();
  const user = session?.user;
  const userLocale = user?.locale;

  const acceptLanguage = await headers()?.get('Accept-Language')!;
  const acceptLanguageLocale = acceptLanguage?.split(',')?.[0];

  const locale = l || userLocale || acceptLanguageLocale || DEFAULT_LOCALE;

  const {dayjs, dayjsLocale} = await initDayjs(locale);

  dateFormat = findDateFormat(locale, dateFormat, dayjsLocale);

  function getLocale() {
    return locale;
  }

  function getDateFormat() {
    return dateFormat;
  }

  function getDayjs() {
    return dayjs;
  }

  function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
    let {minimumFractionDigits, maximumFractionDigits} = options ?? {};
    minimumFractionDigits = limitScale(minimumFractionDigits);
    maximumFractionDigits = limitScale(maximumFractionDigits);

    return new Intl.NumberFormat(transformLocale(locale), {
      ...options,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  }

  return {
    getLocale,
    getDateFormat,
    getDayjs,
    formatNumber,
  };
}
