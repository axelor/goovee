import {headers} from 'next/headers';
import {getSession} from '@/auth';

import {TENANT_HEADER} from '@/proxy';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {findTranslations} from '@/locale/api';
import {translate} from '@/locale/utils';

export async function getTranslation(
  {
    locale,
    user,
    tenant,
  }: {locale?: string | null; user?: any; tenant?: string} = {},
  key: string,
  ...interpolations: string[]
) {
  if (!tenant) {
    tenant = (await headers()).get(TENANT_HEADER) as string;
  }

  if (!user && !locale) {
    const session = await getSession();
    const $user = session?.user;
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

  const {translations} = await findTranslations(locale, tenant);

  return translate(translations, key, ...interpolations);
}

export const t = getTranslation.bind(null, {});

export async function tattr(text: string, ...interpolations: string[]) {
  const key = `value:${text}`;
  const value = await t(key, ...interpolations);
  const translated = key !== value;

  return translated ? value : t(text);
}
