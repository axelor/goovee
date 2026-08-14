import path from 'path';
import fs from 'fs/promises';
import {createHash} from 'crypto';

import {manager, type Tenant, type TenantClient} from '@/tenant';
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
  BUNDLE_CACHE_TTL_MS,
);

const tcache: Record<string, Translations> = {};
const localesDir = path.resolve(process.cwd(), 'public', 'locales');
const localesPromise = fs.readdir(localesDir).catch(() => [] as string[]);

const includeLanguage = () => {
  return process.env.INCLUDE_LANGUAGE === 'true';
};

async function findGeneralTranslations(locale: string): Promise<Translations> {
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
    lang !== locale && includeLanguage() ? readwritecache(lang) : {},
    readwritecache(locale),
  ]);

  return {...langTranslations, ...localeTranslations};
}

async function findTenantTranslations(
  locale: string,
  client: TenantClient,
): Promise<Translations> {
  if (!locale) {
    return {};
  }

  const find = async (language: string): Promise<Translations> => {
    try {
      const rows = await client.aOSMetaTranslation.find({
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
    lang !== locale && includeLanguage() ? find(lang) : {},
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
  tenant?: Tenant,
): Promise<TranslationBundle> {
  const [generalTranslations, tenantTranslations] = await Promise.all([
    findGeneralTranslations(locale),
    tenant ? findTenantTranslations(locale, tenant.client) : {},
  ]);

  const translations = {...generalTranslations, ...tenantTranslations};

  return {translations, hash: computeHash(translations)};
}

/* The tenant id comes from the URL and no route validates it, so failing to
 * resolve one is an ordinary outcome rather than a fault worth reporting. It
 * is treated as no tenant at all, which yields the general-only bundle. */
async function resolveTenant(tenantId: string): Promise<Tenant | undefined> {
  try {
    return await manager.getTenant(tenantId);
  } catch {
    return undefined;
  }
}

export async function findTranslations(
  locale: string = DEFAULT_LOCALE,
  tenantId?: string,
): Promise<TranslationBundle> {
  if (!locale) {
    locale = DEFAULT_LOCALE;
  }

  const tenant = tenantId ? await resolveTenant(tenantId) : undefined;

  /* The requested id is free input, so the key uses the id the tenant
   * actually resolved to. Ids resolving to nothing then share one
   * general-only entry rather than each taking a slot of their own. */
  const cacheKey = `${tenant?.id ?? ''}:${locale}`;

  const cached = bundleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const bundle = loadTranslationBundle(locale, tenant);
  bundleCache.put(cacheKey, bundle);
  bundle.catch(() => bundleCache.delete(cacheKey));

  return bundle;
}
