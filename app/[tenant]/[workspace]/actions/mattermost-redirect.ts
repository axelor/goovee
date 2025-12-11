'use server';

import {getHost} from '@/lib/core/mattermost/utils';

export async function createMattermostRedirectUrl(): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const mattermostHost = getHost();

    if (!mattermostHost) {
      console.error('[MATTERMOST] Mattermost host not configured');
      return {success: false, error: 'Mattermost not configured'};
    }

    return {success: true, url: mattermostHost};
  } catch (error: any) {
    console.error('[MATTERMOST] Unexpected error in redirect action:', error);
    return {success: false, error: error.message};
  }
}
