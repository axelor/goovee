import {cache} from 'react';
import {headers} from 'next/headers';
import {getSession} from '@/auth';

import {TENANT_HEADER} from '@/middleware';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {findTranslations} from '@/locale/api';
import {translate} from '@/locale/utils';

const getTranslations = cache(async function getBundle(
  locale = DEFAULT_LOCALE,
  tenant: string,
  key?: string,
) {
  if (!key) {
    return {};
  }
  return await findTranslations(locale, tenant, [key]);
});

export async function getTranslation(
  {locale, user, tenant}: {locale?: string; user?: any; tenant?: string} = {},
  key: string,
  ...interpolations: string[]
) {
  if (!tenant) {
    tenant = (await headers()).get(TENANT_HEADER) as string;
  }

  if (!user) {
    const session = await getSession();
    const $user: any = session?.user;
    if ($user?.locale) {
      locale = $user.locale;
    }
  }

  if (!locale) {
    const acceptLanguage = (await headers()).get('Accept-Language')!;
    const acceptLanguageLocale = acceptLanguage?.split(',')?.[0];

    if (acceptLanguageLocale) {
      locale = acceptLanguageLocale;
    }
  }

  if (!locale) {
    locale = DEFAULT_LOCALE;
  }

  const translations = await getTranslations(locale, tenant, key);

  return translate(translations as any, key, ...interpolations);
}

export const t = getTranslation.bind(null, {});

export async function tattr(text: string, ...interpolations: string[]) {
  const key = `value:${text}`;
  const value = await t(key, ...interpolations);
  const translated = key !== value;

  return translated ? value : t(text);
}
