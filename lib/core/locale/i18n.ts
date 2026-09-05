import axios from 'axios';
import {translate} from '@/locale/utils';
import {DEFAULT_LOCALE} from '@/locale';
import type {TenantScope} from '@/lib/core/url/tenant-urls';

const rest = axios.create();

/* A failed request is refused by its status, but something between the browser
 * and the application — a captive portal, a proxy that does not route the
 * application's own addresses — can answer with a page of its own and call it
 * success. That arrives as one long string, which spreading would key by
 * character position. Anything that is not an object of text values is read as
 * no translations at all. */
function asTranslations(data: unknown): Record<string, string> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(data).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

export const i18n = (() => {
  let translations: Record<string, string> = {};

  /* `scope` addresses the tenant whose translations these are. Always one:
   * the only caller is mounted inside the tenant shell, and the screens that
   * resolve no tenant carry their own words rather than loading a bundle. */
  async function load(locale: string = DEFAULT_LOCALE, scope: TenantScope) {
    if (!locale) {
      return {};
    }

    translations = await rest
      .get(scope.forBrowser(`/api/locales/${locale}`))
      .then(result => asTranslations(result?.data))
      .catch(() => ({}));
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
