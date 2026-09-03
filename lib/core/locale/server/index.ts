import {headers} from 'next/headers';
import {getSession} from '@/auth';

import {TENANT_HEADER} from '@/proxy';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {findTranslations} from '@/locale/api';
import {
  getLocaleFromAcceptLanguage,
  inverseTransformLocale,
  translate,
} from '@/locale/utils';

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
    /* Read the way the browser reports it and written the way the rest of the
     * portal names a locale: the header uses a hyphen (`fr-FR`) and carries
     * quality values, while a locale is keyed with an underscore here and its
     * language is taken by splitting on one. Left as the header sends it, a
     * region locale would match no shipped file and find no language to fall
     * back to, so the page would render untranslated while the browser — which
     * does convert — asked for and received the full set. */
    const preferred = getLocaleFromAcceptLanguage(
      (await headers()).get('Accept-Language'),
    );

    if (preferred) {
      locale = inverseTransformLocale(preferred);
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
