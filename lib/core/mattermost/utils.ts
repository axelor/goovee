import {getEnv} from '@/environment';

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
  return (
    getEnv()?.GOOVEE_PUBLIC_MATTERMOST_TOKEN ||
    process.env.GOOVEE_PUBLIC_MATTERMOST_TOKEN ||
    ''
  );
}
