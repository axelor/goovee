import {type TenantConfig} from '@/tenant';

/**
 * Get the Mattermost host URL for the tenant. Browser-facing, so it lives in
 * publicEnv (per-tenant override or the env-derived value baked in by the
 * config provider).
 */
export function getHost(config?: TenantConfig | null): string {
  return config?.publicEnv?.GOOVEE_PUBLIC_MATTERMOST_HOST || '';
}

export function getAdminToken(config?: TenantConfig | null): string {
  return config?.mattermost?.token || '';
}

export function isCreateMattermostUsersEnabled(
  config?: TenantConfig | null,
): boolean {
  return config?.mattermost?.createUsers === true;
}

export function getAosUrl(config: TenantConfig): string {
  return config?.aos?.url;
}
