'server only';

import axios from 'axios';

import {DEFAULT_TENANT} from '@/constants';
import {createClient} from '@/goovee/.generated/client';
import {LRUCache} from './lru';
import type {Tenant, TenantConfig} from './types';
import {getStoragePath} from '@/storage/index';

const CACHE_CAPACITY = 20;

async function fetchConfig(id: Tenant['id']) {
  if (!id) return null;

  return await axios
    .get(`${process.env.GOOVEE_PUBLIC_HOST}/api/tenant/${id}/config`, {
      auth: {
        username: process.env.TENANT_MANAGER_BASIC_USERNAME as string,
        password: process.env.TENANT_MANAGER_BASIC_PASSWORD as string,
      },
    })
    .then(({data}) => data)
    .catch(err => {
      throw new Error('Error fetching tenant configuration');
    });
}

export enum TenancyType {
  single = 'single',
  multi = 'multi',
}

interface TenantManager {
  getType(): TenancyType;
  getTenant(id?: Tenant['id']): Promise<Tenant>;
  getConfig(id?: Tenant['id']): Promise<Tenant['config']>;
  getClient(id?: Tenant['id']): Promise<Tenant['client']>;
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

    const config: Tenant['config'] = {
      db: {
        url: process.env.DATABASE_URL!,
      },
      aos: {
        url: process.env.GOOVEE_PUBLIC_AOS_URL!,
        storage: getStoragePath(),
        auth: {
          username: process.env.BASIC_AUTH_USERNAME!,
          password: process.env.BASIC_AUTH_PASSWORD!,
        },
      },
    };

    const client = createClient({
      url: process.env.DATABASE_URL!,
    });

    if (!client) {
      throw new Error('Invalid configuration');
    }

    await client.$connect();
    await client.$sync();

    const tenant = {
      id: DEFAULT_TENANT,
      config,
      client,
    };

    this.tenant = tenant;

    return tenant;
  }

  async getConfig() {
    return this.getTenant().then(tenant => tenant?.config);
  }

  async getClient() {
    return this.getTenant().then(tenant => tenant?.client);
  }
}

export class MultiTenantManager implements TenantManager {
  private cache: LRUCache<Tenant['id'], Tenant>;

  constructor() {
    this.cache = new LRUCache<Tenant['id'], Tenant>(CACHE_CAPACITY);
  }

  getType() {
    return TenancyType.multi;
  }

  async getTenant(id: Tenant['id']) {
    if (!id) {
      throw new Error('Tenant id is required');
    }

    const cached = this.cache.get(id);

    if (cached) {
      return cached;
    }

    try {
      const config: TenantConfig = await fetchConfig(id);

      if (!config) {
        throw new Error('Error getting tenant');
      } else {
        const client = createClient({
          url: config?.db?.url,
        });

        if (!client) {
          throw new Error('Invalid configuration');
        }

        await client.$connect();
        await client.$sync();

        const tenant = {
          id,
          config,
          client,
        };

        this.cache.put(id, tenant);

        return tenant;
      }
    } catch (err) {
      throw new Error('Error getting tenant');
    }
  }
  async getConfig(id: Tenant['id']) {
    if (!id) {
      throw new Error('Tenant id is required');
    }

    return this.getTenant(id).then(tenant => tenant?.config);
  }
  async getClient(id: Tenant['id']) {
    if (!id) {
      throw new Error('Tenant id is required');
    }

    return this.getTenant(id).then(tenant => tenant?.client);
  }
}

export const isMultiTenancy = process.env.MULTI_TENANCY === 'true';

export const manager: TenantManager = isMultiTenancy
  ? new MultiTenantManager()
  : new SingleTenantManager();

export default manager;
