import axios from 'axios';
import {
  getHost,
  getAdminToken,
  isCreateMattermostUsersEnabled,
  getAosUrl,
} from './utils';
import type {
  MattermostUser,
  CreateMattermostUserParams,
  CreateMattermostUserResult,
  SyncOrCreateMattermostUserResult,
} from './types';

async function getMattermostUserByEmail(
  email: string,
): Promise<MattermostUser | null> {
  try {
    const host = getHost();
    const token = getAdminToken();

    if (!host || !token) {
      return null;
    }

    const url = `${host}/api/v4/users/email/${encodeURIComponent(email)}`;

    const {data} = await axios.get<MattermostUser>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
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
    return false;
  }
}

async function updateMattermostEmail(
  userId: string,
  newEmail: string,
): Promise<boolean> {
  try {
    const host = getHost();
    const token = getAdminToken();

    if (!host || !token) {
      return false;
    }

    await axios.put(
      `${host}/api/v4/users/${userId}/patch`,
      {
        email: newEmail,
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
    return false;
  }
}

async function createMattermostUser(
  params: CreateMattermostUserParams,
): Promise<CreateMattermostUserResult> {
  try {
    const aosUrl = await getAosUrl(params.tenantId);

    if (!aosUrl) {
      return {
        success: false,
        error: 'AOS_ERROR',
        message: 'AOS URL not configured',
      };
    }

    const url = `${aosUrl}/ws/user/createUser`;
    const requestBody = {
      name: params.name,
      firstName: params.firstName,
      mail: params.mail,
      password: params.password,
      version: 0,
    };

    await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: process.env.BASIC_AUTH_USERNAME!,
        password: process.env.BASIC_AUTH_PASSWORD!,
      },
    });

    return {
      success: true,
      created: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error,
      message: error.response?.data?.message || error.message,
    };
  }
}

export async function syncOrCreateMattermostUser({
  tenantId,
  email,
  password,
  name,
  firstName,
}: {
  tenantId: string;
  email: string;
  password: string;
  name: string;
  firstName?: string;
}): Promise<SyncOrCreateMattermostUserResult> {
  if (!isCreateMattermostUsersEnabled()) {
    return {
      success: true,
      action: 'skipped',
    };
  }

  try {
    const existingUser = await getMattermostUserByEmail(email);

    if (existingUser) {
      const updated = await updateMattermostPassword(existingUser.id, password);

      if (!updated) {
        return {
          success: false,
          error: 'UPDATE_FAILED',
          message: 'Failed to update Mattermost password',
        };
      }

      return {
        success: true,
        action: 'synced',
        userId: existingUser.id,
      };
    }

    const createResult = await createMattermostUser({
      tenantId,
      name: name || '',
      firstName: firstName || '',
      mail: email,
      password,
    });

    if (!createResult.success) {
      return {
        success: false,
        error: createResult.error,
        message: createResult.message,
      };
    }

    return {
      success: true,
      action: 'created',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error,
      message: error.message,
    };
  }
}

export async function withMattermostSync({
  tenantId,
  email,
  password,
  name,
  firstName,
  context,
}: {
  tenantId: string;
  email: string;
  password: string;
  name: string;
  firstName?: string;
  context: string;
}): Promise<void> {
  const result = await syncOrCreateMattermostUser({
    tenantId,
    email,
    password,
    name,
    firstName,
  });

  if (!result.success) {
    console.error(`[${context}] Mattermost sync/create failed:`, {
      email,
      error: result.error,
      message: result.message,
    });
    throw new Error(result.message || 'Mattermost sync failed');
  }
}

export async function withMattermostEmailSync({
  oldEmail,
  newEmail,
}: {
  oldEmail: string;
  newEmail: string;
}): Promise<void> {
  if (!isCreateMattermostUsersEnabled()) {
    return;
  }

  const existingUser = await getMattermostUserByEmail(oldEmail);

  if (!existingUser) {
    return;
  }

  const updated = await updateMattermostEmail(existingUser.id, newEmail);

  if (!updated) {
    throw new Error('Failed to update Mattermost email');
  }
}
