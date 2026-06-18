import path from 'path';
import fs from 'fs/promises';
import {createHash} from 'crypto';

import {manager} from '@/tenant';
import {LRUCache} from '@/tenant/lru';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {findLocaleLanguage} from '@/locale/utils';

type Translations = Record<string, string | null | undefined>;

type TranslationBundle = {
  translations: Translations;
  hash: string;
};

const BUNDLE_CACHE_CAPACITY = 100;
const BUNDLE_CACHE_TTL_MS = 60 * 1000;

/* The cache stores promises so concurrent requests for a cold or expired
 * bundle share a single load instead of each hitting the DB. */
const bundleCache = new LRUCache<string, Promise<TranslationBundle>>(
  BUNDLE_CACHE_CAPACITY,
  {ttlMs: BUNDLE_CACHE_TTL_MS},
);

const tcache: Record<string, Translations> = {};
const localesDir = path.resolve(process.cwd(), 'public', 'locales');
const localesPromise = fs.readdir(localesDir).catch(() => [] as string[]);

async function findGeneralTranslations(
  locale: string,
  includeLanguage: boolean,
): Promise<Translations> {
  if (!locale) {
    return {};
  }

  const readFile = async (code: string) => {
    const fileName = `${code}.json`;
    const locales = await localesPromise;
    if (!locales.includes(fileName)) {
      return {};
    }
    try {
      const filepath = path.resolve(localesDir, fileName);
      return JSON.parse(await fs.readFile(filepath, 'utf8'));
    } catch (err) {
      console.error(err);
      return {};
    }
  };

  const readwritecache = async (code: string) => {
    if (tcache[code]) {
      return tcache[code];
    } else {
      const result = await readFile(code);
      tcache[code] = result;
      return result;
    }
  };

  const lang = findLocaleLanguage(locale);

  const [langTranslations, localeTranslations] = await Promise.all([
    lang !== locale && includeLanguage ? readwritecache(lang) : {},
    readwritecache(locale),
  ]);

  return {...langTranslations, ...localeTranslations};
}

async function findTenantTranslations(
  locale: string,
  tenantId: string,
  includeLanguage: boolean,
): Promise<Translations> {
  if (!(locale && tenantId)) {
    return {};
  }

  const find = async (language: string): Promise<Translations> => {
    try {
      const tenant = await manager.getTenant(tenantId);
      if (!tenant) return {};
      const rows = await tenant.client.aOSMetaTranslation.find({
        where: {language},
        select: {key: true, value: true},
      });
      return rows.reduce<Translations>((acc, row) => {
        if (row.key) {
          acc[row.key] = row.value;
        }
        return acc;
      }, {});
    } catch (err) {
      console.error(err);
      return {};
    }
  };

  const lang = findLocaleLanguage(locale);

  const [langTranslations, localeTranslations] = await Promise.all([
    lang !== locale && includeLanguage ? find(lang) : {},
    find(locale),
  ]);

  return {...langTranslations, ...localeTranslations};
}

function computeHash(translations: Translations): string {
  // Sort so the hash is insensitive to DB row order.
  const entries = Object.keys(translations)
    .sort()
    .map(key => [key, translations[key]]);

  return createHash('sha1').update(JSON.stringify(entries)).digest('hex');
}

async function loadTranslationBundle(
  locale: string,
  tenantId?: string,
): Promise<TranslationBundle> {
  /* includeLanguage (also load the base language, e.g. `en` for `en-US`) is a
   * per-tenant toggle; tenant-less contexts default to off. */
  const includeLanguage = tenantId
    ? Boolean((await manager.getConfig(tenantId))?.includeLanguage)
    : false;

  const [generalTranslations, tenantTranslations] = await Promise.all([
    findGeneralTranslations(locale, includeLanguage),
    tenantId ? findTenantTranslations(locale, tenantId, includeLanguage) : {},
  ]);

  const translations = {...generalTranslations, ...tenantTranslations};

  return {translations, hash: computeHash(translations)};
}

export function findTranslations(
  locale: string = DEFAULT_LOCALE,
  tenantId?: string,
): Promise<TranslationBundle> {
  if (!locale) {
    locale = DEFAULT_LOCALE;
  }

  const cacheKey = `${tenantId ?? ''}:${locale}`;

  const cached = bundleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const bundle = loadTranslationBundle(locale, tenantId);
  bundleCache.put(cacheKey, bundle);
  bundle.catch(() => bundleCache.delete(cacheKey));

  return bundle;
}
