import {type TenantConfig} from '@/tenant';

/**
 * Get the Mattermost host URL for the tenant. Browser-facing, so it lives in
 * the tenant's `public` group.
 */
export function getHost(config?: TenantConfig | null): string {
  return config?.public.mattermost?.host || '';
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
