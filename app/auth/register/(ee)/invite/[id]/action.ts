'use server';

import {revalidatePath} from 'next/cache';

import {deleteInviteById} from '@/app/[tenant]/[workspace]/account/common/orm/invites';
import {getSession} from '@/auth';
import {registerByInvite, type RegisterInviteDTO} from '@/lib/core/auth/orm';
import {getTranslation, t} from '@/locale/server';
import {findPartnerByEmail, updatePartner} from '@/orm/partner';
import {Scope} from '@/otp/constants';
import {findOne, isValid} from '@/otp/orm';
import {Tenant} from '@/tenant';
import {PortalWorkspace} from '@/types';

import {findInviteById} from '../../../common/orm/register';

function error(message: string) {
  return {
    error: true,
    message,
  };
}

export async function registerByEmail(data: RegisterInviteDTO) {
  const {email, password, otp, tenantId} = data;

  if (!tenantId) {
    return error(await t('TenantId is required'));
  }

  if (!(email && password)) {
    return error(await getTranslation({tenant: tenantId}, 'Bad request'));
  }

  if (password.length < 8) {
    return error(
      await getTranslation(
        {tenant: tenantId},
        'Password must be at least 8 characters',
      ),
    );
  }

  if (!otp) {
    return error(await getTranslation({tenant: tenantId}, 'OTP is required.'));
  }

  const otpResult = await findOne({
    scope: Scope.Registration,
    entity: email,
    tenantId,
  });

  if (!otpResult) {
    return error(await getTranslation({tenant: tenantId}, 'Invalid OTP'));
  }

  if (!(await isValid({id: otpResult.id, value: otp, tenantId}))) {
    return error(await getTranslation({tenant: tenantId}, 'Invalid OTP'));
  }

  return registerByInvite(data);
}

export async function subscribe({
  workspaceURL,
  tenantId,
  inviteId,
}: {
  workspaceURL: PortalWorkspace['url'];
  tenantId?: Tenant['id'] | null;
  inviteId: string;
}) {
  if (!(workspaceURL && inviteId && tenantId)) {
    return error(await t('Bad request'));
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  const invite = await findInviteById({id: inviteId, tenantId});

  if (
    !(
      invite &&
      invite.partner &&
      invite.partner.id &&
      invite.emailAddress?.address === user.email &&
      invite.workspace &&
      invite.workspace.url === workspaceURL
    )
  ) {
    return error(await t('Bad request'));
  }

  const contactConfig = invite?.contactAppPermissionList?.[0];

  if (!contactConfig) {
    return error(await t('Bad request'));
  }

  const $user = await findPartnerByEmail(user.email, tenantId, {
    where: {
      isContact: {
        eq: true,
      },
    },
  });

  if (!$user) {
    return error(await t('User not found'));
  }

  const data = {
    id: $user?.id,
    version: $user.version,
    contactWorkspaceConfigSet: {select: [{id: contactConfig.id}]},
  } as any;

  try {
    const updatedUser = await updatePartner({
      data,
      tenantId,
    });

    revalidatePath('/', 'layout');
  } catch (err) {
    return error(await t('Error subscribing, try again'));
  }

  deleteInviteById({
    id: invite.id,
    tenantId,
  }).catch(err => {
    console.error(err);
  });

  return {
    success: true,
    message: await t('Subscribed successfully.'),
  };
}
