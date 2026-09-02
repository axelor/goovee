'use server';

import {z} from 'zod';
import {headers} from 'next/headers';
import {getSession} from '@/auth';
import {t} from '@/locale/server';
import {manager} from '@/tenant';
import {TENANT_HEADER} from '@/proxy';
import {updatePreferences} from '@/orm/notification';
import {revalidateWorkspacePath} from '@/lib/core/url/revalidate';
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

  const {workspaceURL, code, data: notificationData} = validation.data;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('Tenant not found'));
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return error(await t('Tenant not found'));
  }
  const {client} = tenant;

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

    revalidateWorkspacePath({tenantId, workspaceURL}, '/account/notifications');

    return {
      success: true,
      message: await t('Preference updated'),
    };
  } catch (err) {
    return error(await t('Cannot update preference. Try again.'));
  }
}
