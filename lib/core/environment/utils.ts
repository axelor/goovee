import {getGlobalPublicEnv} from '@/tenant/config-provider';
import type {PublicEnv, TenantConfig} from '@/tenant';

export function getPublicEnvironment(config?: TenantConfig | null): PublicEnv {
  return config?.publicEnv ?? getGlobalPublicEnv();
}
