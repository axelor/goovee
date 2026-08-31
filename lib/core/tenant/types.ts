import {GooveeClient} from '@/goovee/.generated/client';

/* The document's shape lives in ./schema — one declaration that validates a
 * document, types it, and that `pnpm config:schema` turns into
 * tenants.config.schema.json. Re-exported here so the rest of the app keeps
 * reading its configuration types from one place. */
export {PUBLIC_ENV_KEYS} from './schema';
export type {
  GlobalConfig,
  GlobalConfigInput,
  PublicEnvKey,
  TenantConfig,
  TenantConfigInput,
} from './schema';

import type {PublicEnvKey, TenantConfig} from './schema';

/* The browser-side view of a tenant's variables, in which any of them may be
 * absent. A configured tenant always has a host, so a consumer holding a whole
 * tenant's configuration reads `TenantConfig['publicEnv']`, which says so. */
export type PublicEnv = Partial<Record<PublicEnvKey, string>>;

export type Tenant = {
  id: string;
  config: TenantConfig;
  client: TenantClient;
};

export type TenantClient = GooveeClient;
