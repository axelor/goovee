import {experimental_taintUniqueValue} from 'react';
import {type TenantConfig} from '@/tenant';

/**
 * Get the Mattermost host URL from environment variables
 */
export function getHost(): string {
  return process.env.GOOVEE_PUBLIC_MATTERMOST_HOST || '';
}

export function getAdminToken(): string {
  const token = process.env.MATTERMOST_TOKEN || '';

  if (token) {
    experimental_taintUniqueValue(
      'Mattermost token is a server secret. Do not pass to Client Components.',
      process,
      token,
    );
  }

  return token;
}

export function isCreateMattermostUsersEnabled(): boolean {
  return process.env.CREATE_MATTERMOST_USERS === 'true';
}

export function getAosUrl(config: TenantConfig): string {
  return config?.aos?.url;
}
