import {GooveeClient} from '@/goovee/.generated/client';

/* The configuration's shape lives in @/config/schema — one declaration that
 * validates it, types it, and that `pnpm config:generate` turns into the
 * operator references. Re-exported here so the rest of the app keeps reading
 * its configuration types from one place. */
export type {
  DeploymentConfig,
  DeploymentConfigInput,
  PublicConfig,
  TenantConfig,
  TenantConfigInput,
} from '@/config/schema';

import type {TenantConfig} from '@/config/schema';

export type Tenant = {
  id: string;
  config: TenantConfig;
  client: TenantClient;
};

export type TenantClient = GooveeClient;
