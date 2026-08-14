import path from 'path';
import fs from 'fs/promises';
import {createHash} from 'crypto';

import {manager, type TenantClient, type TenantConfig} from '@/tenant';
import {getTenantConfigSync} from '@/tenant/config-provider';
import {LRUCache} from '@/tenant/lru';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {findLocaleLanguage} from '@/locale/utils';

type Translations = Record<string, string | null | undefined>;

type TranslationBundle = {
  translations: Translations;
  hash: string;
  /* The tenant's own translations are missing because they could not be read,
   * not because it has none. Such a bundle is served but never kept. */
  partial: boolean;
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
  client: TenantClient,
  includeLanguage: boolean,
): Promise<Translations> {
  if (!locale) {
    return {};
  }

  /* A query failure is left to propagate rather than answered with an empty set.
   * An unreachable database is not a tenant that has no translations, and only
   * the second is worth keeping a bundle for. */
  const find = async (language: string): Promise<Translations> => {
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

/**
 * Load one locale's bundle for a tenant, or the general-only bundle when there
 * is none.
 *
 * The config arrives already resolved, so the tenant is looked up here only for
 * the client its own translations are read with — and only when a cold bundle is
 * actually being built.
 *
 * A tenant whose own translations cannot be read still gets a bundle, in the
 * shipped wording, marked `partial`: every page and every error message is built
 * through here, so a database that is briefly unreachable must not be what takes
 * the portal down. The mark is what stops it being kept — the caller does not
 * cache it, and the route serving the browser refuses it.
 */
async function loadTranslationBundle(
  locale: string,
  tenantId?: string,
  config?: TenantConfig | null,
): Promise<TranslationBundle> {
  /* includeLanguage (also load the base language, e.g. `en` for `en-US`) is a
   * per-tenant toggle; tenant-less contexts default to off. */
  const includeLanguage = Boolean(config?.includeLanguage);

  let partial = false;

  const readTenantTranslations = async (): Promise<Translations> => {
    if (!tenantId) return {};

    try {
      const client = await manager.getClient(tenantId);
      return client
        ? await findTenantTranslations(locale, client, includeLanguage)
        : {};
    } catch (error) {
      console.error(
        `Could not read translations for tenant "${tenantId}" (${locale}) — falling back to the shipped wording:`,
        error,
      );
      partial = true;
      return {};
    }
  };

  const [generalTranslations, tenantTranslations] = await Promise.all([
    findGeneralTranslations(locale, includeLanguage),
    readTenantTranslations(),
  ]);

  const translations = {...generalTranslations, ...tenantTranslations};

  return {translations, hash: computeHash(translations), partial};
}

export async function findTranslations(
  locale: string = DEFAULT_LOCALE,
  tenantId?: string,
): Promise<TranslationBundle> {
  if (!locale) {
    locale = DEFAULT_LOCALE;
  }

  /* The requested id is free input and no route validates it, so the key uses
   * the id that actually resolves against the configuration. Ids resolving to
   * nothing then share one general-only entry instead of each taking a slot,
   * which is what stops a series of made-up ids evicting real tenants' bundles.
   *
   * Resolving through the config provider rather than the tenant manager keeps
   * this a map read: computing a cache key must not connect a database, and an
   * unknown id must not be indistinguishable from an unreachable one. */
  const config = tenantId ? getTenantConfigSync(tenantId) : null;
  const resolvedTenantId = config ? tenantId : undefined;

  const cacheKey = `${resolvedTenantId ?? ''}:${locale}`;

  const cached = bundleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const bundle = loadTranslationBundle(locale, resolvedTenantId, config);
  bundleCache.put(cacheKey, bundle);

  /* Held only once it proves complete. A bundle that fell back to the shipped
   * wording, or failed outright, is dropped so the next request tries again
   * rather than serving the shortfall for the rest of the entry's life. */
  bundle
    .then(loaded => loaded.partial && bundleCache.delete(cacheKey))
    .catch(() => bundleCache.delete(cacheKey));

  return bundle;
}
