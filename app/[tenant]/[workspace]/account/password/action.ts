'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {compare, hash} from '@/auth/utils';
import {t} from '@/locale/server';
import {findGooveeUserByEmail} from '@/orm/partner';
import {TENANT_HEADER} from '@/middleware';
import {manager} from '@/tenant';

export async function changePassword({
  oldPassword,
  newPassword,
}: {
  oldPassword: string;
  newPassword: string;
}) {
  if (!(oldPassword && newPassword)) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const partner = await findGooveeUserByEmail(user?.email, tenantId);

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

  const hashedNewPassword = await hash(newPassword);

  const client = await manager.getClient(tenantId);

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
