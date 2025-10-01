import axios from 'axios';
import {getHost, getAdminToken} from './utils';
import type {MattermostUser, SyncMattermostPasswordResult} from './types';

async function getMattermostUserByEmail(
  email: string,
): Promise<MattermostUser | null> {
  try {
    const host = getHost();
    const token = getAdminToken();

    if (!host || !token) {
      console.error('[MATTERMOST] Host or token not configured');
      return null;
    }

    const {data} = await axios.get<MattermostUser>(
      `${host}/api/v4/users/email/${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }

    console.error('[MATTERMOST] Error fetching user by email:', {
      email,
      status: error.response?.status,
      message: error.message,
    });

    throw error;
  }
}

async function updateMattermostPassword(
  userId: string,
  newPassword: string,
): Promise<boolean> {
  try {
    const host = getHost();
    const token = getAdminToken();

    if (!host || !token) {
      console.error('[MATTERMOST] Host or token not configured');
      return false;
    }

    await axios.put(
      `${host}/api/v4/users/${userId}/password`,
      {
        new_password: newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return true;
  } catch (error: any) {
    console.error('[MATTERMOST] Error updating password:', {
      userId,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });

    return false;
  }
}

export async function syncMattermostPassword(
  email: string,
  newPassword: string,
): Promise<SyncMattermostPasswordResult> {
  try {
    const mattermostUser = await getMattermostUserByEmail(email);

    if (!mattermostUser) {
      return {
        success: true,
        synced: false,
      };
    }

    const updated = await updateMattermostPassword(
      mattermostUser.id,
      newPassword,
    );

    if (!updated) {
      return {
        success: false,
        error: 'UPDATE_FAILED',
        message: 'Failed to update Mattermost password',
      };
    }

    console.log('[MATTERMOST] Password synced successfully:', {
      email,
      userId: mattermostUser.id,
    });

    return {
      success: true,
      synced: true,
    };
  } catch (error: any) {
    console.error('[MATTERMOST] Unexpected error syncing password:', {
      email,
      error: error.message,
    });

    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: error.message,
    };
  }
}
