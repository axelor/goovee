import type {PublicEnv, TenantConfig} from '@/tenant';

/* A tenant's browser-exposed variables. There is no deployment-wide fallback:
 * a context with no tenant (the tenant-less auth pages) has no browser
 * variables, so callers pass that tenant's config — or null for an empty set. */
export function getPublicEnvironment(config: TenantConfig | null): PublicEnv {
  return config?.publicEnv ?? {};
}
