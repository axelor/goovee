'use server';

import {headers} from 'next/headers';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {compare, hash} from '@/auth/utils';
import {t} from '@/locale/server';
import {findGooveeUserByEmail} from '@/orm/partner';
import {TENANT_HEADER} from '@/proxy';
import {manager} from '@/tenant';
import {withMattermostSync} from '@/mattermost';
import {CHANGE_PASSWORD} from '@/constants';
import {
  ChangePasswordSchema,
  type ChangePassword,
} from '@/auth/validation-utils';

export async function changePassword(data: ChangePassword) {
  const validation = ChangePasswordSchema.safeParse(data);

  if (!validation.success) {
    return {
      error: true,
      message: z.prettifyError(validation.error),
    };
  }

  const {oldPassword, newPassword} = validation.data;

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Bad request')};
  const {client} = tenant;

  const partner = await findGooveeUserByEmail(user?.email, client);

  if (!partner?.password) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const isOldPasswordMatch = await compare(oldPassword, partner.password);

  if (!isOldPasswordMatch) {
    return {
      error: true,
      message: await t('Invalid old password'),
    };
  }

  try {
    await withMattermostSync({
      config: tenant.config,
      email: user.email,
      password: newPassword,
      name: partner.name || 'user',
      firstName: partner.firstName || 'user',
      context: CHANGE_PASSWORD,
    });
  } catch (err) {
    return {
      message: await t('Error setting new password. Try again.'),
      success: false,
    };
  }

  const hashedNewPassword = await hash(newPassword);

  try {
    await client.aOSPartner.update({
      data: {
        id: partner.id,
        version: partner.version,
        password: hashedNewPassword,
      },
      select: {id: true},
    });
  } catch (err) {
    return {
      error: true,
      message: await t('Error setting new password. Try again.'),
    };
  }

  return {
    success: true,
    message: await t('Password changed successfully.'),
  };
}
