'use server';

import {getSession} from '@/auth';
import {t} from '@/locale/server';
import {updatePreferences} from '@/orm/notification';
import {revalidatePath} from 'next/cache';

const error = (message: string) => {
  return {
    error: true,
    message,
  };
};

export async function updatePreference({
  workspaceURL,
  workspaceURI,
  code,
  data,
  tenant,
}: {
  code: string;
  data?: {
    activateNotification?: boolean;
    record?: {
      id: string;
      activateNotification?: boolean;
    };
  };
  workspaceURL: string;
  workspaceURI: string;
  tenant: string;
}) {
  if (!(code && data && workspaceURL && tenant)) {
    return error(await t('Code, url, tenant and payload is required'));
  }
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  try {
    const result = await updatePreferences({
      url: workspaceURL,
      code,
      user,
      tenantId: tenant,
      ...data,
    });

    if (!result) {
      throw new Error();
    }

    revalidatePath(`${workspaceURI}/account/notifications`);

    return {
      success: true,
      message: await t('Preference updated'),
    };
  } catch (err) {
    return error(await t('Cannot update preference. Try again.'));
  }
}
