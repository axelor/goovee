import {GooveeClient} from '@/goovee/.generated/client';
import type {FileStore} from '@/storage/index';

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
  /** Where this tenant's files live, built from its AOS storage settings. */
  store: FileStore;
};

export type TenantClient = GooveeClient;
