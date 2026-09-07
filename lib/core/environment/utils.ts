import type {PublicConfig, TenantConfig} from '@/tenant';

/* A tenant's browser-facing settings, or null for a tenant that is not
 * configured. There is no deployment-wide fallback: everything a browser is
 * told about belongs to one tenant, so a caller holding no tenant holds no
 * settings either. */
export function getPublicEnvironment(
  config: TenantConfig | null,
): PublicConfig | null {
  return config?.public ?? null;
}
