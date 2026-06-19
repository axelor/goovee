'server only';

import {DEFAULT_TENANT} from '@/constants';
import {createClient} from '@/goovee/.generated/client';
import {ensureStorageDir} from '@/storage/index';
import {LRUCache} from './lru';
import {tenantConfigProvider} from './config-provider';
import type {Tenant, TenantConfig} from './types';

const CACHE_CAPACITY = 20;

export enum TenancyType {
  single = 'single',
  multi = 'multi',
}

interface TenantManager {
  getType(): TenancyType;
  /* Resolves to null for an unknown (or missing) tenant id — callers guard with
   * `if (!tenant)` and return a 4xx. A genuine connection failure still throws. */
  getTenant(id?: Tenant['id']): Promise<Tenant | null>;
  getConfig(id?: Tenant['id']): Promise<Tenant['config'] | undefined>;
  getClient(id?: Tenant['id']): Promise<Tenant['client'] | undefined>;
  listTenantIds(): Promise<string[]>;
}

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

  await client.$connect();
  await client.$sync();
  // Create unaccent extension for PostgreSQL if it doesn't exist
  await client.$raw('CREATE EXTENSION IF NOT EXISTS unaccent');

  /* Storage is per-tenant config now; make sure the directory exists before any
   * upload writes to it (replaces the old getStoragePath side effect). */
  ensureStorageDir(config.aos.storage);

  return {id, config, client};
}

export class SingleTenantManager implements TenantManager {
  private tenant: Tenant | undefined = undefined;

  getType() {
    return TenancyType.single;
  }

  async getTenant() {
    if (this.tenant) {
      return this.tenant;
    }

    const config = await tenantConfigProvider.get(DEFAULT_TENANT);

    if (!config) {
      throw new Error('Invalid configuration');
    }

    this.tenant = await connectTenant(DEFAULT_TENANT, config);

    return this.tenant;
  }

  async getConfig() {
    return this.getTenant().then(tenant => tenant?.config);
  }

  async getClient() {
    return this.getTenant().then(tenant => tenant?.client);
  }

  async listTenantIds() {
    return tenantConfigProvider.list();
  }
}

export class MultiTenantManager implements TenantManager {
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

  getType() {
    return TenancyType.multi;
  }

  async getTenant(id: Tenant['id']): Promise<Tenant | null> {
    if (!id) {
      return null;
    }

    const cached = this.cache.get(id);

    if (cached) {
      return cached;
    }

    const config = await tenantConfigProvider.get(id);

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

  async getConfig(id: Tenant['id']) {
    return this.getTenant(id).then(tenant => tenant?.config);
  }

  async getClient(id: Tenant['id']) {
    return this.getTenant(id).then(tenant => tenant?.client);
  }

  async listTenantIds() {
    return tenantConfigProvider.list();
  }
}

export const isMultiTenancy = process.env.MULTI_TENANCY === 'true';

export const manager: TenantManager = isMultiTenancy
  ? new MultiTenantManager()
  : new SingleTenantManager();

export default manager;
