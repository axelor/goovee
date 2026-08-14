import axios from 'axios';
import {findLocaleLanguage, translate} from '@/locale/utils';
import {DEFAULT_LOCALE} from '@/locale';
import {withBasePath} from '@/lib/core/path/base-path';

const rest = axios.create();

export const i18n = (() => {
  let translations: Record<string, string> = {};

  async function load(
    locale: string = DEFAULT_LOCALE,
    tenant?: string,
    host?: string,
  ) {
    if (!locale) {
      return {};
    }

    const fetchLocale = async (locale: string) =>
      rest
        .get(withBasePath(`/locales/${locale}.json`))
        .then(r => (r?.status === 200 && r?.data ? r.data : {}))
        .catch(() => ({}));

    if (!tenant) {
      const lang = findLocaleLanguage(locale);

      const [langTranslations, localeTranslations] = await Promise.all([
        lang !== locale ? fetchLocale(lang) : {},
        fetchLocale(locale),
      ]);

      translations = {
        ...translations,
        ...langTranslations,
        ...localeTranslations,
      };

      return;
    }

    try {
      const response = await rest.get(
        `${host ?? ''}${withBasePath(`/api/tenant/${tenant}/locales/${locale}`)}`,
      );

      translations = {...(response?.data || {})};
    } catch (err) {
      console.error(err);

      /* A refused bundle still carries the wording it fell back to — the same
       * wording the page was rendered from. Working out a replacement here would
       * mean re-deriving which locale files the server read, and a wrong guess
       * renders a different language from the one being hydrated. */
      const served = axios.isAxiosError(err) ? err.response?.data : undefined;

      /* Nothing was served at all — the request never arrived. Only the locale's
       * own file is read, which is what the server reads by default; whether to
       * read the base language too is a per-tenant setting not known here, and
       * assuming it would translate strings the server left alone. */
      translations =
        served && typeof served === 'object'
          ? {...served}
          : {...(await fetchLocale(locale))};
    }
  }

  function t(text: string, ...interpolations: string[]) {
    return translate(translations, text, ...interpolations);
  }

  function tattr(text: string, ...interpolations: string[]) {
    const key = `value:${text}`;
    const value = t(key, ...interpolations);
    const translated = key !== value;

    return translated ? value : t(text);
  }

  return {
    load,
    t,
    tattr,
    translations,
  };
})();
