'use server';

import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import type {Client} from '@/goovee/.generated/client';
import {accessMessage} from '@/lib/core/access/denial';
import {ensureWorkspaceAccess} from '@/lib/core/access/ensure-workspace-access';
import {findWorkspaceMembers} from '@/orm/workspace';
import {isAdminContact, isPartner, updatePartner} from '@/orm/partner';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {findInviteById} from '../../common/orm/invites';
import {findAvailableSubapps} from '../../common/orm/members';
import {Authorization} from '../../common/types';
import {
  UpdateInviteApplicationSchema,
  UpdateInviteAuthenticationSchema,
  DeleteMemberSchema,
  UpdateMemberApplicationSchema,
  UpdateMemberAuthenticationSchema,
  type UpdateInviteApplication,
  type UpdateInviteAuthentication,
  type DeleteMember,
  type UpdateMemberApplication,
  type UpdateMemberAuthentication,
} from '../../common/utils/validators';

function error(message: string) {
  return {
    error: true,
    message,
  };
}

/**
 * Whether the caller may administer this workspace's members. The workspace
 * itself has already been authorized by the gate, so this answers only the
 * member-administration question and works from the pieces the caller holds.
 */
async function canUpdate({
  workspaceURL,
  client,
}: {
  workspaceURL: string;
  client: Client;
}) {
  const isPartnerUser = await isPartner();
  const isAdminContactUser = await isAdminContact({
    workspaceURL,
    client,
  });

  const canDelete = isPartnerUser || isAdminContactUser;

  if (!canDelete) {
    return false;
  }

  return true;
}

export async function updateInviteApplication(input: UpdateInviteApplication) {
  const validation = UpdateInviteApplicationSchema.safeParse(input);

  if (!validation.success) {
    return error(z.prettifyError(validation.error));
  }

  const {invite, app, value} = validation.data;

  const access = await ensureWorkspaceAccess();

  if (!access.ok) {
    return error(await accessMessage(access.reason));
  }

  const {user, tenant} = access;
  const {client} = tenant;
  const workspaceURL = access.url.key();

  const canUpdateInvite = await canUpdate({workspaceURL, client});

  if (!canUpdateInvite) {
    return error(await t('Unauthorized'));
  }

  const $invite = await findInviteById({id: invite.id, client});

  if (!$invite) {
    return error(await t('Bad request'));
  }

  const partnerId = user?.isContact ? user.mainPartnerId : user.id;

  if (!($invite?.partner?.id && $invite.partner.id === partnerId)) {
    return error(await t('Unauthorized'));
  }

  const availableApps = await findAvailableSubapps({
    url: workspaceURL,
    client,
  });

  const $app = availableApps.find((a: any) => a.code === app.code);

  if (!$app) {
    return error(await t('Bad request'));
  }

  const contactConfig: any = $invite?.contactAppPermissionList?.[0];

  if (!contactConfig) {
    return error(await t('Invalid operation'));
  }

  const existingApp = contactConfig?.contactAppPermissionList.find(
    (a: any) => a.app.code === $app.code,
  );

  try {
    const data: any = {
      id: contactConfig.id,
      version: contactConfig.version,
    };

    if (value === 'yes' && !existingApp) {
      data.contactAppPermissionList = {
        create: [
          {
            app: {
              select: {
                id: $app.id,
              },
            },
            roleSelect: Authorization.restricted,
          },
        ],
      };
    } else if (value === 'no') {
      if (existingApp) {
        data.contactAppPermissionList = {
          remove: [existingApp.id],
        };
      }
    }

    const updatedConfig = await client.aOSPortalContactWorkspaceConfig.update({
      data,
      select: {id: true},
    });

    return {
      success: true,
      data: await findInviteById({id: invite.id, client}),
    };
  } catch (err) {
    console.log(err);
    return error(await t('Error updating invite. Try again.'));
  }
}

export async function updateInviteAuthentication(
  input: UpdateInviteAuthentication,
) {
  const validation = UpdateInviteAuthenticationSchema.safeParse(input);

  if (!validation.success) {
    return error(z.prettifyError(validation.error));
  }

  const {invite, app, value} = validation.data;

  const access = await ensureWorkspaceAccess();

  if (!access.ok) {
    return error(await accessMessage(access.reason));
  }

  const {user, tenant} = access;
  const {client} = tenant;
  const workspaceURL = access.url.key();

  const canUpdateInvite = await canUpdate({workspaceURL, client});

  if (!canUpdateInvite) {
    return error(await t('Unauthorized'));
  }

  const $invite = await findInviteById({id: invite.id, client});

  if (!$invite) {
    return error(await t('Bad request'));
  }

  const partnerId = user?.isContact ? user.mainPartnerId : user.id;

  if (!($invite?.partner?.id && $invite.partner.id === partnerId)) {
    return error(await t('Unauthorized'));
  }

  const availableApps = await findAvailableSubapps({
    url: workspaceURL,
    client,
  });

  const $app = availableApps.find((a: any) => a.code === app.code);

  if (!$app) {
    return error(await t('Bad request'));
  }

  const contactConfig: any = $invite?.contactAppPermissionList?.[0];

  if (!contactConfig) {
    return error(await t('Invite not configured for workspace'));
  }

  const existingApp = contactConfig?.contactAppPermissionList.find(
    (a: any) => a.app.code === $app.code,
  );

  if (!existingApp) {
    return error(await t('Invite does not have access to this application'));
  }

  try {
    const updatedConfig = await client.aOSPortalContactWorkspaceConfig.update({
      data: {
        id: contactConfig.id,
        version: contactConfig.version,
        contactAppPermissionList: {
          update: [
            {
              id: existingApp.id,
              version: existingApp.version,
              roleSelect: value,
            },
          ],
        },
      },
      select: {id: true},
    });

    return {
      success: true,
      data: await findInviteById({id: invite.id, client}),
    };
  } catch (err) {
    console.log(err);
    return error(await t('Error updating invite. Try again.'));
  }
}

export async function deleteMember(input: DeleteMember) {
  const validation = DeleteMemberSchema.safeParse(input);

  if (!validation.success) {
    return error(z.prettifyError(validation.error));
  }

  const {member} = validation.data;

  const access = await ensureWorkspaceAccess();

  if (!access.ok) {
    return error(await accessMessage(access.reason));
  }

  const {user, tenant} = access;
  const {client} = tenant;
  const workspaceURL = access.url.key();

  const canUpdateInvite = await canUpdate({workspaceURL, client});

  if (!canUpdateInvite) {
    return error(await t('Unauthorized'));
  }

  const adminContact = await isAdminContact({workspaceURL, client});

  const partnerId = (user?.isContact ? user.mainPartnerId : user.id)!;

  const members = await findWorkspaceMembers({
    client,
    url: workspaceURL,
    partnerId,
  });

  const partnerMember = members?.partners?.find(p => p.id === member.id);

  if (partnerMember && adminContact) {
    return error(await t('Unauthorized')); // admin contact cannot remove partner
  }

  const $member = members?.contacts?.find((c: any) => c.id === member.id);

  if (!$member?.contactWorkspaceConfig?.id) {
    return error(await t('Bad request'));
  }

  try {
    const updatedPartner = await updatePartner({
      data: {
        id: $member.id,
        version: $member.version,
        contactWorkspaceConfigSet: {
          remove: [$member.contactWorkspaceConfig?.id],
        } as any,
      },
      client,
    }).then(clone);

    return {
      success: true,
      data: updatedPartner,
    };
  } catch (err) {
    return error(await t('Error updating member. Try again.'));
  }
}

export async function updateMemberApplication(input: UpdateMemberApplication) {
  const validation = UpdateMemberApplicationSchema.safeParse(input);

  if (!validation.success) {
    return error(z.prettifyError(validation.error));
  }

  const {member, app, value} = validation.data;

  const access = await ensureWorkspaceAccess();

  if (!access.ok) {
    return error(await accessMessage(access.reason));
  }

  const {user, tenant} = access;
  const {client} = tenant;
  const workspaceURL = access.url.key();

  const canUpdateInvite = await canUpdate({workspaceURL, client});

  if (!canUpdateInvite) {
    return error(await t('Unauthorized'));
  }

  const partnerId = (user?.isContact ? user.mainPartnerId : user.id)!;

  const members = await findWorkspaceMembers({
    client,
    url: workspaceURL,
    partnerId,
  });

  const adminContact = await isAdminContact({workspaceURL, client});

  const partnerMember = members?.partners?.find(p => p.id === member.id);

  if (partnerMember && adminContact) {
    return error(await t('Unauthorized')); // admin contact cannot update partner
  }

  const $member = members?.contacts?.find((c: any) => c.id === member.id);

  if (!$member) {
    return error(await t('Bad request'));
  }

  const availableApps = await findAvailableSubapps({
    url: workspaceURL,
    client,
  });

  const $app = availableApps.find((a: any) => a.code === app.code);

  if (!$app) {
    return error(await t('Bad request'));
  }

  const contactConfig: any = $member?.contactWorkspaceConfig;

  if (!contactConfig) {
    return error(await t('Invalid operation'));
  }

  const existingApp = contactConfig?.contactAppPermissionList?.find(
    (a: any) => a.app.code === $app.code,
  );

  try {
    const data: any = {
      id: contactConfig.id,
      version: contactConfig.version,
    };

    if (value === 'yes' && !existingApp) {
      data.contactAppPermissionList = {
        create: [
          {
            app: {
              select: {
                id: $app.id,
              },
            },
            roleSelect: Authorization.restricted,
          },
        ],
      };
    } else if (value === 'no') {
      if (existingApp) {
        data.contactAppPermissionList = {
          remove: [existingApp.id],
        };
      }
    }

    const updatedConfig = await client.aOSPortalContactWorkspaceConfig
      .update({
        data,
        select: {id: true},
      })
      .then(clone);

    return {
      success: true,
      data: updatedConfig,
    };
  } catch (err) {
    console.log(err);
    return error(await t('Error updating invite. Try again.'));
  }
}

export async function updateMemberAuthentication(
  input: UpdateMemberAuthentication,
) {
  const validation = UpdateMemberAuthenticationSchema.safeParse(input);

  if (!validation.success) {
    return error(z.prettifyError(validation.error));
  }

  const {member, app, value} = validation.data;

  const access = await ensureWorkspaceAccess();

  if (!access.ok) {
    return error(await accessMessage(access.reason));
  }

  const {user, tenant} = access;
  const {client} = tenant;
  const workspaceURL = access.url.key();

  const canUpdateInvite = await canUpdate({workspaceURL, client});

  if (!canUpdateInvite) {
    return error(await t('Unauthorized'));
  }

  const partnerId = (user?.isContact ? user.mainPartnerId : user.id)!;

  const members = await findWorkspaceMembers({
    client,
    url: workspaceURL,
    partnerId,
  });

  const adminContact = await isAdminContact({workspaceURL, client});

  const partnerMember = members?.partners?.find(p => p.id === member.id);

  if (partnerMember && adminContact) {
    return error(await t('Unauthorized')); // admin contact cannot update partner
  }

  const $member = members?.contacts?.find((c: any) => c.id === member.id);

  if (!$member) {
    return error(await t('Bad request'));
  }

  const availableApps = await findAvailableSubapps({
    url: workspaceURL,
    client,
  });

  const $app = availableApps.find((a: any) => a.code === app.code);

  if (!$app) {
    return error(await t('Bad request'));
  }

  const contactConfig: any = $member?.contactWorkspaceConfig;

  if (!contactConfig) {
    return error(await t('Member not found in workspace'));
  }

  const existingApp = contactConfig?.contactAppPermissionList?.find(
    (a: any) => a.app.code === $app.code,
  );

  if (!existingApp) {
    return error(await t('Member does not have access to this application'));
  }

  try {
    const updatedConfig = await client.aOSPortalContactWorkspaceConfig
      .update({
        data: {
          id: contactConfig.id,
          version: contactConfig.version,
          contactAppPermissionList: {
            update: [
              {
                id: existingApp.id,
                version: existingApp.version,
                roleSelect: value,
              },
            ],
          },
        },
        select: {id: true},
      })
      .then(clone);

    return {
      success: true,
      data: updatedConfig,
    };
  } catch (err) {
    console.log(err);
    return error(await t('Error updating invite. Try again.'));
  }
}
