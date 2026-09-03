'use server';

import {z} from 'zod';
import {t} from '@/locale/server';
import {accessMessage} from '@/lib/core/access/denial';
import {ensureWorkspaceAccess} from '@/lib/core/access/ensure-workspace-access';
import {updatePreferences} from '@/orm/notification';
import {
  UpdateNotificationPreferenceSchema,
  type UpdateNotificationPreference,
} from '../common/utils/validators';

const error = (message: string) => {
  return {
    error: true,
    message,
  };
};

export async function updatePreference(data: UpdateNotificationPreference) {
  const validation = UpdateNotificationPreferenceSchema.safeParse(data);

  if (!validation.success) {
    return error(z.prettifyError(validation.error));
  }

  const {code, data: notificationData} = validation.data;

  const access = await ensureWorkspaceAccess();

  if (!access.ok) {
    return error(await accessMessage(access.reason));
  }

  const {user, tenant, url} = access;
  const {client} = tenant;
  const workspaceURL = access.workspace.url;

  try {
    const result = await updatePreferences({
      url: workspaceURL,
      code,
      user,
      client,
      activateNotification: notificationData.activateNotification,
      record: notificationData.record,
    });

    if (!result) {
      throw new Error();
    }

    url.revalidate('/account/notifications');

    return {
      success: true,
      message: await t('Preference updated'),
    };
  } catch (err) {
    return error(await t('Cannot update preference. Try again.'));
  }
}
