import axios from 'axios';
import {findLocaleLanguage, translate} from '@/locale/utils';
import {DEFAULT_LOCALE} from '@/locale';

const rest = axios.create();

export const i18n = (() => {
  let translations: Record<string, string> = {};

  async function load(locale: string = DEFAULT_LOCALE, tenant?: string) {
    if (!locale) {
      return {};
    }

    if (tenant) {
      try {
        const env: any = await rest
          .get('/api/config')
          .then(result => result?.data)
          .catch(() => ({}));

        const result = await rest
          .get(
            `${env?.GOOVEE_PUBLIC_HOST}/api/tenant/${tenant}/locales/${locale}`,
          )
          .then(result => result?.data || {})
          .catch(() => ({}));

        translations = {
          ...result,
        };
      } catch (err) {
        console.error(err);
      }
    } else {
      const fetchLocale = async (locale: string) =>
        rest
          .get(`/locales/${locale}.json`)
          .then(r => (r?.status === 200 && r?.data ? r.data : {}))
          .catch(() => ({}));

      const lang = findLocaleLanguage(locale);

      await Promise.all([
        ...(lang !== locale ? [fetchLocale(lang)] : []),
        fetchLocale(locale),
      ])
        .then(([langTranslations, localeTranslations]) => {
          translations = {
            ...translations,
            ...langTranslations,
            ...localeTranslations,
          };
        })
        .catch(err => {
          console.error(err);
        });
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
