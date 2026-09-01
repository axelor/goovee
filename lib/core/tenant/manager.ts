'server only';

import {createClient} from '@/goovee/.generated/client';
import {ensureStorageDir} from '@/storage/index';
import {LRUCache} from './lru';
import {getGlobalConfig, tenantConfigProvider} from './config-provider';
import type {Tenant, TenantConfig} from './types';

const CACHE_CAPACITY = 20;

async function connectTenant(
  id: Tenant['id'],
  config: TenantConfig,
): Promise<Tenant> {
  const client = createClient({
    url: config.db.url,
    features: {
      normalization: {
        lowerCase: true,
        unaccent: true,
      },
    },
  });

  if (!client) {
    throw new Error('Invalid configuration');
  }

  try {
    await client.$connect();
    await client.$sync();
    // Create unaccent extension for PostgreSQL if it doesn't exist
    await client.$raw('CREATE EXTENSION IF NOT EXISTS unaccent');

    /* Storage is per-tenant config; make sure the directory exists before any
     * upload writes to it. */
    ensureStorageDir(config.aos.storage);
  } catch (err) {
    await client.$disconnect().catch((disconnectError: unknown) => {
      console.error(
        `Failed to release tenant "${id}" after a failed connection:`,
        disconnectError,
      );
    });

    throw err;
  }

  return {id, config, client};
}

/*
 * One manager for every deployment. It serves the tenants the configuration
 * document names, so a document with one entry fills one cache slot and never
 * evicts anything.
 *
 * The signatures say what each method costs. `getConfig`, `getDefaultTenantId`
 * and `listTenantIds` are synchronous: they read the configuration document,
 * which is already in memory. `getTenant` and `getClient` return a promise
 * because they may open a Postgres pool, and the cache below then evicts
 * another tenant to make room for it.
 */
export class TenantManager {
  private cache: LRUCache<Tenant['id'], Tenant>;

  constructor() {
    /* Evicted tenants must release their Postgres pool, or every eviction
     * beyond CACHE_CAPACITY leaks connections. */
    this.cache = new LRUCache<Tenant['id'], Tenant>(CACHE_CAPACITY, {
      onEvict: tenant => {
        tenant.client.$disconnect().catch((err: unknown) => {
          console.error(
            `Failed to disconnect evicted tenant "${tenant.id}":`,
            err,
          );
        });
      },
    });
  }

  /* Resolves to null for an unknown (or missing) tenant id — callers guard with
   * `if (!tenant)` and return a 4xx. A genuine connection failure still throws. */
  async getTenant(id: Tenant['id']): Promise<Tenant | null> {
    if (!id) {
      return null;
    }

    const cached = this.cache.get(id);

    if (cached) {
      return cached;
    }

    const config = tenantConfigProvider.get(id);

    if (!config) {
      /* Unknown tenant is not an error: callers guard with `if (!tenant)` and
       * return a 4xx. Throwing here would turn attacker-controllable path
       * values into 500s. A genuine connection failure below still throws. */
      return null;
    }

    try {
      const tenant = await connectTenant(id, config);

      this.cache.put(id, tenant);

      return tenant;
    } catch (err) {
      throw new Error(`Error connecting tenant "${id}"`, {cause: err});
    }
  }

  getConfig(id: Tenant['id']) {
    return tenantConfigProvider.get(id);
  }

  async getClient(id: Tenant['id']) {
    return this.getTenant(id).then(tenant => tenant?.client);
  }

  /**
   * The tenant used by addresses that name none: `/`, the auth screens, and a
   * script run without `--tenant`. Null unless the document declares one, and
   * then those addresses have to be told which tenant they are for.
   *
   * The document is checked at load, so any name returned here is one it names.
   */
  getDefaultTenantId(): string | null {
    return getGlobalConfig().defaultTenant ?? null;
  }

  listTenantIds() {
    return tenantConfigProvider.list();
  }
}

export const manager = new TenantManager();

export default manager;
