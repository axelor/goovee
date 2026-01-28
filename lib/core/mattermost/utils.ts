import {getEnv} from '@/environment';
import {manager, type Tenant} from '@/tenant';

/**
 * Get the Mattermost host URL from environment variables
 */
export function getHost(): string {
  return (
    getEnv()?.GOOVEE_PUBLIC_MATTERMOST_HOST ||
    process.env.GOOVEE_PUBLIC_MATTERMOST_HOST ||
    ''
  );
}

export function getAdminToken(): string {
  return getEnv()?.MATTERMOST_TOKEN || process.env.MATTERMOST_TOKEN || '';
}

export function isCreateMattermostUsersEnabled(): boolean {
  const envValue =
    getEnv()?.CREATE_MATTERMOST_USERS || process.env.CREATE_MATTERMOST_USERS;
  return envValue === 'true';
}

export async function getAosUrl(tenantId: Tenant['id']): Promise<string> {
  const tenant = await manager.getTenant(tenantId);
  return tenant?.config?.aos?.url;
}
