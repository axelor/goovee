'use server';

import {z} from 'zod';
import {headers} from 'next/headers';
import {revalidatePath} from 'next/cache';
import {after} from 'next/server';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {getPublicEnvironment} from '@/environment';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import {manager} from '@/tenant';
import {
  findContactByEmail,
  findGooveeUserByEmail,
  findPartnerById,
  isAdminContact,
  isPartner,
} from '@/orm/partner';
import {findWorkspace} from '@/orm/workspace';
import NotificationManager, {NotificationType} from '@/notification';
import {SEARCH_PARAMS} from '@/constants';
import {getPartnerId} from '@/utils';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {getAccountConfig} from '../../../common/orm/config';
import {inviteTemplate} from '../../../common/constants/template';
import {
  findInviteForEmail,
  createInvite,
  findInviteById,
  deleteInviteById,
} from '../../../common/orm/invites';
import {InviteAppsConfig, Role} from '../../../common/types';
import {findAvailableSubapps} from '../../../common/orm/members';
import {isValidMailConfig, replacePlaceholders} from '@/orm/email-template';

function error(message: string) {
  return {
    error: true,
    message,
  };
}

export async function deleteInvite({
  id,
  workspaceURL,
}: {
  id: string;
  workspaceURL: string;
}) {
  if (!(id && workspaceURL)) {
    return error(await t('Bad request'));
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('Bad request'));
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return error(await t('Tenant not found'));
  const {client} = tenant;

  const workspace = await findWorkspace({url: workspaceURL, user, client});

  if (!workspace) {
    return error(await t('Bad request'));
  }

  const isPartnerUser = await isPartner();
  const isAdminContactUser = await isAdminContact({workspaceURL, client});

  const canDelete = isPartnerUser || isAdminContactUser;

  if (!canDelete) {
    return error(await t('Unauthorized'));
  }

  const invite = await findInviteById({id, client});

  const partnerId = (user?.isContact ? user.mainPartnerId : user.id)!;

  if (!(invite && invite?.partner?.id && invite.partner.id === partnerId)) {
    return error(await t('Invalid invite'));
  }

  try {
    const result = await deleteInviteById({id, client});
    if (!result) {
      throw new Error();
    } else {
      return {
        success: true,
        message: await t('Invite deleted successfully'),
      };
    }
  } catch (err) {
    return error(await t('Error deleting invite'));
  }
}

export async function sendInvites({
  workspaceURL,
  workspaceURI,
  emails,
  role,
  apps,
}: {
  workspaceURL: string;
  workspaceURI: string;
  emails: string;
  role: Role;
  apps: InviteAppsConfig;
}) {
  if (!(emails && workspaceURL && apps)) {
    return error(await t('Bad request'));
  }

  const emailAddresses = emails
    .split(',')
    ?.map(email => email?.trim())
    .filter(Boolean);

  if (!emailAddresses) {
    return error(await t('Bad request'));
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('Bad request'));
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return error(await t('Tenant not found'));
  const {client} = tenant;

  const workspace = await findWorkspace({url: workspaceURL, user, client});

  if (!workspace) {
    return error(await t('Bad request'));
  }

  const config = await getAccountConfig(workspace.config.id, client);

  if (!config) {
    return error(await t('Bad request'));
  }

  if (!config.canInviteMembers) {
    return error(await t('Unauthorized'));
  }

  const isPartnerUser = await isPartner();
  const isAdminContactUser = await isAdminContact({workspaceURL, client});

  const canInviteMembers = isPartnerUser || isAdminContactUser;

  if (!canInviteMembers) {
    return error(await t('Unauthorized'));
  }

  const isValidUser = await findGooveeUserByEmail(user.email, client);

  if (!isValidUser) {
    return error(await t('Unauthorized'));
  }

  let availableApps = [];

  try {
    availableApps = await findAvailableSubapps({
      url: workspaceURL,
      client,
    });
  } catch (err) {
    return error(await t('Error sending invites'));
  }

  const filteredApps = Object.entries(apps).reduce((acc, [code, config]) => {
    const availableApp = availableApps.find((a: any) => a.code === code);
    if (config && availableApp) {
      acc[code] = {...config, id: availableApp.id};
    }
    return acc;
  }, {} as InviteAppsConfig);

  if (!Object.keys(filteredApps)?.length) {
    return error(await t('No apps available.'));
  }

  let inviteError;

  const partnerId = getPartnerId(user);

  const partner = await findPartnerById(partnerId, client);

  if (!partner) {
    return error(await t('Invalid partner'));
  }

  const emailsWithMemberAlready = [],
    emailsWithOutSamePartner = [],
    emailsWithExistingInvite = [],
    emailsAlreadyRegistered = [];
  let invitesCount = 0;

  let mailConfig: any;

  if (config.invitationTemplateList?.length) {
    const {invitationTemplateList} = config;
    const localization = partner?.localization?.code;

    let template =
      localization &&
      invitationTemplateList.find(
        (t: any) => t?.localization?.code === localization,
      );

    if (!template) {
      template = invitationTemplateList?.[0];
    }

    mailConfig = {
      template: template?.template,
    };
  }

  /* Pin the (guarded non-null) tenant config: TS does not carry the earlier
   * `if (!tenant) return` narrowing into this closure. */
  const tenantConfig = tenant.config;

  function sendMail({email, link, subject}: any) {
    const mailService = NotificationManager.getService(
      NotificationType.mail,
      tenantConfig,
    );

    after(async () => {
      try {
        if (mailConfig && isValidMailConfig(mailConfig)) {
          const {template} = mailConfig;

          await mailService?.notify({
            to: email,
            subject: template?.subject || 'Greetings from Goovee',
            html: replacePlaceholders({
              content: template?.content,
              values: {
                context: {
                  link,
                  email,
                },
              },
            }),
          });
        } else {
          await mailService?.notify(
            inviteTemplate({
              subject,
              email,
              link,
            }),
          );
        }
      } catch (err) {
        console.error('[INVITE] Failed to send invite mail', err);
      }
    });
  }

  for (const email of emailAddresses) {
    try {
      z.email({
        error: 'Invalid email address',
      }).parse(email);

      const existingGooveeUser = await findGooveeUserByEmail(email, client);
      const isExistingPartner =
        existingGooveeUser && !existingGooveeUser?.isContact;

      if (isExistingPartner) {
        emailsAlreadyRegistered.push(email);
        continue; // don't send invite to partner already registered
      }

      const existingContact = await findContactByEmail(email, client);

      if (config.isExistingContactsOnly) {
        if (!existingContact?.isContact) {
          emailsWithOutSamePartner.push(email);
          continue; // don't send invite to email who is not a contact
        }

        if (existingContact?.mainPartner?.id !== partnerId) {
          emailsWithOutSamePartner.push(email);
          continue; // don't send invite to email who don't have current partner as main partner
        }
      }

      const memberAlready = existingContact?.contactWorkspaceConfigSet?.find(
        (config: any) =>
          config?.portalWorkspace?.url === workspaceURL &&
          config?.partner?.id === partnerId,
      );

      if (memberAlready) {
        emailsWithMemberAlready.push(email);
        continue; // don't send invite to contact if already a member
      }

      const existingInvite = await findInviteForEmail({
        email,
        client,
        partnerId,
        workspaceURL,
      });

      if (existingInvite) {
        emailsWithExistingInvite.push(email);
        continue;
      }

      const invite = await createInvite({
        workspace,
        client,
        email,
        role,
        apps: filteredApps,
        partnerId,
      });

      if (!invite?.id) {
        inviteError = true;
        continue;
      }

      invitesCount += 1;

      sendMail({
        subject: workspace?.name || workspace.url,
        email,
        link: `${getPublicEnvironment(tenant.config).GOOVEE_PUBLIC_HOST}${withBasePath(
          `/auth/register/invite/${invite.id}/email?${SEARCH_PARAMS.TENANT_ID}=${tenantId}`,
        )}`,
      });
    } catch (err) {
      inviteError = true;
    }
  }

  if (inviteError) {
    return error(await t('Error sending invites, try again.'));
  } else {
    revalidatePath(`${workspaceURI}/account/members`);

    let message = '';

    const isSuccess = invitesCount > 0;

    if (isSuccess) {
      message = await t('Invites send successfully.');
    }

    const isEmailsWithMemberAlready = emailsWithMemberAlready.length;
    const isEmailsWithoutSamePartner = emailsWithOutSamePartner.length;

    const isEmailsWithExistingInvite = emailsWithExistingInvite.length;
    const isEmailsAlreadyRegistered = emailsAlreadyRegistered.length;

    if (
      isEmailsWithMemberAlready ||
      isEmailsWithoutSamePartner ||
      isEmailsWithExistingInvite ||
      isEmailsAlreadyRegistered
    ) {
      message += `\n ${await t('Some invites are not send for the following ')} ${await t('reason')} : `;

      const errors = [];

      const getEmails = (emails: string[]) => emails.join(', ');

      isEmailsWithMemberAlready &&
        errors.push(
          await t(
            'Members already exists - {0}',
            getEmails(emailsWithMemberAlready),
          ),
        );

      isEmailsWithExistingInvite &&
        errors.push(
          await t(
            'Invites already exists - {0}',
            getEmails(emailsWithExistingInvite),
          ),
        );

      isEmailsWithoutSamePartner &&
        errors.push(
          await t(
            'Registered under different owner already - {0}',
            getEmails(emailsWithOutSamePartner),
          ),
        );

      isEmailsAlreadyRegistered &&
        errors.push(
          await t(
            'An account with this email exists already - {0}',
            getEmails(emailsAlreadyRegistered),
          ),
        );

      message += errors.join('; ');
    }
    return {
      ...(isSuccess ? {success: true} : {error: true}),
      message,
    };
  }
}
