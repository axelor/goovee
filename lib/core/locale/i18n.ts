import axios from 'axios';
import {translate} from '@/locale/utils';
import {DEFAULT_LOCALE} from '@/locale';
import {withBasePath} from '@/lib/core/path/base-path';

const rest = axios.create();

export const i18n = (() => {
  let translations: Record<string, string> = {};

  async function load(locale: string = DEFAULT_LOCALE, tenant?: string) {
    if (!locale) {
      return {};
    }

    const url = withBasePath(
      tenant
        ? `/api/tenant/${tenant}/locales/${locale}`
        : `/api/locales/${locale}`,
    );

    try {
      const result = await rest
        .get(url)
        .then(result => result?.data || {})
        .catch(() => ({}));

      translations = {
        ...result,
      };
    } catch (err) {
      console.error(err);
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
