'use server';

import {z} from 'zod';
import {revalidateEverything} from '@/lib/core/url/revalidate';

import {deleteInviteById} from '@/app/[tenant]/[workspace]/account/common/orm/invites';
import {getSession} from '@/auth';
import {getTranslation} from '@/locale/server';
import {findPartnerByEmail, updatePartner} from '@/orm/partner';
import {manager} from '@/tenant';
import {
  InviteSubscribeSchema,
  type InviteSubscribe,
} from '@/lib/core/auth/validation-utils';

import {findInviteById} from '../../../common/orm/register';

function error(message: string): {error: true; message: string} {
  return {
    error: true,
    message,
  };
}

export async function subscribe(data: InviteSubscribe) {
  const validation = InviteSubscribeSchema.safeParse(data);

  if (!validation.success) {
    return {error: true, message: z.prettifyError(validation.error)};
  }

  const {workspaceURL, tenantId, inviteId} = validation.data;

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await getTranslation({tenant: tenantId}, 'Unauthorized'));
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant)
    return error(await getTranslation({tenant: tenantId}, 'Invalid tenant'));
  const {client} = tenant;

  const invite = await findInviteById({id: inviteId, client});

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
    return error(await getTranslation({tenant: tenantId}, 'Bad request'));
  }

  const contactConfig = invite?.contactAppPermissionList?.[0];

  if (!contactConfig) {
    return error(await getTranslation({tenant: tenantId}, 'Bad request'));
  }

  const $user = await findPartnerByEmail(user.email, client, {
    where: {
      isContact: {
        eq: true,
      },
    },
  });

  if (!$user) {
    return error(await getTranslation({tenant: tenantId}, 'User not found'));
  }

  const updateData = {
    id: $user?.id,
    version: $user.version,
    contactWorkspaceConfigSet: {select: [{id: contactConfig.id}]},
  } as any;

  try {
    await updatePartner({
      data: updateData,
      client,
    });

    revalidateEverything();
  } catch (err) {
    return error(
      await getTranslation({tenant: tenantId}, 'Error subscribing, try again'),
    );
  }

  deleteInviteById({
    id: invite.id,
    client,
  }).catch(err => {
    console.error(err);
  });

  return {
    success: true,
    message: await getTranslation(
      {tenant: tenantId},
      'Subscribed successfully.',
    ),
  };
}
