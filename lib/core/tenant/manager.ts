'server only';

import {taintSecret} from '@/lib/core/security/taint';
import {DEFAULT_TENANT} from '@/constants';
import {createClient} from '@/goovee/.generated/client';
import {LRUCache} from './lru';
import type {Tenant, TenantConfig} from './types';
import {getStoragePath} from '@/storage/index';

const CACHE_CAPACITY = 20;

function getAOSAuth() {
  const apiKey = process.env.AOS_API_KEY;
  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!apiKey && (!username || !password)) {
    throw new Error(
      'AOS auth not configured: set AOS_API_KEY or BASIC_AUTH_USERNAME/BASIC_AUTH_PASSWORD',
    );
  }

  taintSecret(
    'AOS API key is a server secret. Do not pass to Client Components.',
    apiKey,
  );

  taintSecret(
    'AOS password is a server secret. Do not pass to Client Components.',
    password,
  );

  return {username, password, apiKey};
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

    const dbUrl = process.env.DATABASE_URL;
    const aosUrl = process.env.AOS_URL;
    const webhookSecret = process.env.NOTIFICATION_WEBHOOK_SECRET;
    const auth = getAOSAuth();

    const config: Tenant['config'] = {
      db: {
        url: dbUrl!,
      },
      aos: {
        url: aosUrl!,
        storage: getStoragePath(),
        auth,
        webhookSecret,
      },
    };

    taintSecret(
      'Database URL is a server secret. Do not pass to Client Components.',
      dbUrl,
    );

    taintSecret(
      'Webhook secret is a server secret. Do not pass to Client Components.',
      webhookSecret,
    );

    const client = createClient({
      url: dbUrl!,
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

    if (id !== DEFAULT_TENANT) {
      throw new Error('Error getting tenant');
    }

    try {
      const config: TenantConfig = {
        db: {
          url: process.env.DATABASE_URL!,
        },
        aos: {
          url: process.env.AOS_URL!,
          storage: getStoragePath(),
          auth: getAOSAuth(),
          webhookSecret: process.env.NOTIFICATION_WEBHOOK_SECRET,
        },
      };

      taintSecret(
        'Database URL is a server secret. Do not pass to Client Components.',
        config.db.url,
      );

      taintSecret(
        'Webhook secret is a server secret. Do not pass to Client Components.',
        config.aos.webhookSecret,
      );

      const client = createClient({
        url: config?.db?.url,
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

      const tenant = {
        id,
        config,
        client,
      };

      this.cache.put(id, tenant);

      return tenant;
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
