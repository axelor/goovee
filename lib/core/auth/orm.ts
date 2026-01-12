import {deleteInviteById} from '@/app/[tenant]/[workspace]/account/common/orm/invites';
import {findInviteById} from '@/app/auth/register/common/orm/register';
import {
  ALLOW_ALL_REGISTRATION,
  ALLOW_AOS_ONLY_REGISTRATION,
  ALLOW_NO_REGISTRATION,
  INVITE_REGISTER,
  REGISTER,
  REGISTER_CONTACT,
} from '@/constants';
import {findRegistrationLocalization} from '@/orm/localizations';
import {
  findContactByEmail,
  findContactById,
  findGooveeUserByEmail,
  findPartnerAllowedToRegister,
  findPartnerByEmail,
  findPartnerById,
  registerContact,
  registerPartner,
  updatePartner,
} from '@/orm/partner';
import {findWorkspaceByURL} from '@/orm/workspace';
import {revalidatePath} from 'next/cache';
import {getTranslation, t} from '../locale/server';
import {UserType} from './types';
import {manager, type Tenant} from '../tenant';
import type {Partner, PortalWorkspace} from '@/types';
import {hash} from './utils';
import {getGooveeEnvironment} from '../environment/utils';
import {withMattermostSync} from '../mattermost/user-api';

function error(message: string) {
  return {
    error: true,
    message,
  };
}

export type RegisterInviteDTO = {
  firstName: string;
  name: string;
  email: string;
  otp?: string;
  password?: string;
  tenantId: string;
  inviteId: string;
  locale?: string;
};

export async function registerByInvite({
  firstName,
  name,
  email,
  password,
  tenantId,
  inviteId,
  locale,
}: RegisterInviteDTO) {
  if (!(name && firstName && tenantId && inviteId)) {
    return error(await t('Bad request'));
  }

  const invite = await findInviteById({id: inviteId, tenantId});

  if (!invite) {
    return error(await t('Invalid invite'));
  }

  if (!invite?.partner?.id) {
    return error(await t('No partner available for the workspace'));
  }

  if (email !== invite.emailAddress?.address) {
    return error(
      await t(
        'This invitation is valid only for the email address it was sent to.',
      ),
    );
  }

  const {workspace} = invite;

  if (!workspace) {
    return error(await t('Invalid workspace'));
  }

  const gooveeUser = await findGooveeUserByEmail(email, tenantId);

  if (gooveeUser) {
    return error(
      await t('Already registered, try login and subscribing invite'),
    );
  }

  const existingRecord = await findContactByEmail(email, tenantId);

  if (
    existingRecord &&
    existingRecord.mainPartner &&
    existingRecord.mainPartner.id !== invite.partner.id
  ) {
    return error(await t('Contact already exists with another partner.'));
  }

  const contactConfig = invite?.contactAppPermissionList?.[0];

  let localization = invite.partner?.localization;

  if (!localization) {
    localization = await findRegistrationLocalization({locale, tenantId});
  }

  if (password) {
    try {
      await withMattermostSync({
        tenantId,
        email,
        password,
        name,
        firstName,
        context: INVITE_REGISTER,
      });
    } catch (err: any) {
      return {
        message: await t('Error registering contact. Try again.'),
        success: false,
      };
    }
  }

  try {
    const contact = await registerContact({
      email,
      name,
      firstName,
      password,
      tenantId,
      contactConfig,
      existingRecord,
      partnerId: invite.partner.id,
      localizationId: localization?.id,
    });

    const uri = `${workspace.url.replace(process.env.GOOVEE_PUBLIC_HOST, '')}`;

    revalidatePath('/', 'layout');

    deleteInviteById({
      id: invite.id,
      tenantId,
    }).catch(err => {
      console.error(err);
    });

    return {
      success: true,
      data: {
        contact,
        query: `?callbackurl=${encodeURIComponent(`${invite.workspace?.url}/`)}&workspaceURI=${encodeURIComponent(`${uri}/`)}&tenant=${tenantId}`,
      },
    };
  } catch (err) {
    return error(await t('Error registering contact. Try again.'));
  }
}

export type RegisterDTO = {
  type: UserType;
  companyName?: string;
  identificationNumber?: string;
  companyNumber?: string;
  firstName?: string;
  name: string;
  email: string;
  otp?: string;
  password?: string;
  confirmPassword?: string;
  workspaceURL?: string;
  tenantId: Tenant['id'];
  locale?: string;
};

export async function register({
  type,
  companyName,
  identificationNumber,
  companyNumber,
  firstName,
  name,
  email,
  password,
  workspaceURL,
  tenantId,
  locale,
}: RegisterDTO) {
  const isIndividual = type === UserType.individual;

  if (isIndividual && !name) {
    return error(await getTranslation({tenant: tenantId}, 'Name is required.'));
  }

  const isCompany = type === UserType.company;

  if (isCompany && !companyName) {
    return error(
      await getTranslation({tenant: tenantId}, 'Company name is required'),
    );
  }

  if (!tenantId) {
    return error(
      await getTranslation({tenant: tenantId}, 'Tenant is required.'),
    );
  }

  if (!workspaceURL) {
    return error(
      await getTranslation({tenant: tenantId}, 'Workspace is required.'),
    );
  }

  const workspace = await findWorkspaceByURL({url: workspaceURL, tenantId});

  if (!workspace) {
    return error(await getTranslation({tenant: tenantId}, 'Invalid workspace'));
  }

  const registrationScope = workspace.allowRegistrationSelect;

  if (!registrationScope || registrationScope === ALLOW_NO_REGISTRATION) {
    return error(
      await getTranslation({tenant: tenantId}, 'Registration not allowed'),
    );
  }

  const existingUser = await findGooveeUserByEmail(email, tenantId);

  if (existingUser) {
    return error(
      await getTranslation({tenant: tenantId}, 'Account already exists'),
    );
  }

  let aosPartner = await findPartnerByEmail(email, tenantId);
  if (aosPartner) {
    // there could be multiple partners with the same email, so we preferrably take the one that is allowed to register
    const allowedPartner = await findPartnerAllowedToRegister(email, tenantId);
    if (allowedPartner) {
      aosPartner = allowedPartner;
    }
  }
  const isNewEmail = !aosPartner;

  const isAosContact = aosPartner?.isContact;
  const isAosPartner = !isAosContact;

  const isAllowedToRegister = aosPartner?.isAllowedToRegister;

  const registrationError = error(
    await getTranslation({tenant: tenantId}, 'Registration not allowed'),
  );

  const companyRegistrationError = error(
    await getTranslation(
      {
        locale,
        tenant: tenantId,
      },
      'You are trying to create an account for an existing company, please contact admin to invite you as a user',
    ),
  );

  if (registrationScope === ALLOW_AOS_ONLY_REGISTRATION) {
    if (isNewEmail) {
      return registrationError;
    } else if (isAosPartner) {
      if (!isAllowedToRegister) return registrationError;
      const existingAdminContact: any =
        await findActiveAdminContactForWorkspace({
          url: workspaceURL,
          tenantId,
          partnerId: aosPartner.id,
        });

      if (existingAdminContact?.id || existingAdminContact?.error) {
        return companyRegistrationError;
      }
      /** Register */
    } else if (isAosContact) {
      if (!isAllowedToRegister) return registrationError;
      if (!aosPartner?.mainPartner) {
        const result: any = await transformAosContactAsPartner(
          aosPartner.id,
          tenantId,
        );
        if (!('success' in result)) return registrationError;
        /** Register */
      } else {
        return registerAosContactAsAdmin({
          type,
          companyName,
          identificationNumber,
          companyNumber,
          firstName,
          name,
          email,
          password,
          workspaceURL,
          tenantId,
          locale,
        });
      }
    } else {
    }
  } else if (registrationScope === ALLOW_ALL_REGISTRATION) {
    if (isNewEmail) {
      /** Register */
    } else if (isAosPartner) {
      const existingAdminContact: any =
        await findActiveAdminContactForWorkspace({
          url: workspaceURL,
          tenantId,
          partnerId: aosPartner.id,
        });

      if (existingAdminContact?.id || existingAdminContact?.error) {
        return companyRegistrationError;
      }

      /** Register */
    } else if (isAosContact) {
      if (!aosPartner?.mainPartner) {
        const result = await transformAosContactAsPartner(
          aosPartner.id,
          tenantId,
          locale,
        );
        if (!('success' in result)) return registrationError;
        /** Register */
      } else {
        return registerAosContactAsAdmin({
          type,
          companyName,
          identificationNumber,
          companyNumber,
          firstName,
          name,
          email,
          password,
          workspaceURL,
          tenantId,
          locale,
        });
      }
    } else {
    }
  }

  const localization = await findRegistrationLocalization({locale, tenantId});

  if (password) {
    const isCompany = type === UserType.company;
    const $name = isCompany ? companyName : name;
    const $firstName = isCompany ? companyName : firstName;
    try {
      await withMattermostSync({
        tenantId,
        email,
        password,
        name: $name || '',
        firstName: $firstName || '',
        context: REGISTER,
      });
    } catch (err: any) {
      return {
        message: await getTranslation(
          {locale, tenant: tenantId},
          'Error registering, try again',
        ),
        success: false,
      };
    }
  }

  try {
    const partner = await registerPartner({
      type,
      companyName,
      identificationNumber,
      companyNumber,
      firstName,
      name,
      email,
      password,
      workspaceURL,
      tenantId,
      localizationId: localization?.id,
    });

    const $partner =
      partner?.id && (await findPartnerById(partner.id, tenantId));

    if ($partner) {
      return {
        success: true,
        message: await getTranslation(
          {locale, tenant: tenantId},
          'Registered successfully',
        ),
      };
    }
  } catch (err) {}

  return error(
    await getTranslation(
      {locale, tenant: tenantId},
      'Error registering, try again',
    ),
  );
}

async function transformAosContactAsPartner(
  id: Partner['id'],
  tenantId: Tenant['id'],
  locale?: string,
) {
  if (!tenantId)
    return error(await getTranslation({locale}, 'TenantId is required'));

  if (!id)
    return error(
      await getTranslation({tenant: tenantId, locale}, 'Bad Request'),
    );

  const client = await manager.getClient(tenantId);

  if (!client)
    return error(
      await getTranslation({tenant: tenantId, locale}, 'Bad Request'),
    );

  const contact = await findContactById(id, tenantId);

  if (!contact)
    return error(
      await getTranslation({tenant: tenantId, locale}, 'Bad Request'),
    );

  try {
    await updatePartner({
      data: {
        id: contact.id,
        version: contact.version,
        isContact: false,
      },
      tenantId,
    });
    return {
      success: true,
    };
  } catch (err) {
    return error(
      await getTranslation(
        {tenant: tenantId, locale},
        'Error updating resource',
      ),
    );
  }
}
async function registerAosContactAsAdmin({
  type,
  companyName,
  identificationNumber,
  companyNumber,
  firstName,
  name,
  email,
  password,
  workspaceURL,
  tenantId,
  locale,
}: RegisterDTO) {
  if (!tenantId)
    return error(await getTranslation({locale}, 'TenantId is required'));

  if (!email)
    return error(
      await getTranslation({tenant: tenantId, locale}, 'Email is required'),
    );

  const client = await manager.getClient(tenantId);

  if (!client)
    return error(
      await getTranslation({tenant: tenantId, locale}, 'Invalid tenant'),
    );

  if (!workspaceURL)
    return error(
      await getTranslation({tenant: tenantId}, 'Workspace is required'),
    );

  const workspace = await findWorkspaceByURL({url: workspaceURL, tenantId});

  if (!workspace) {
    return error(await getTranslation({tenant: tenantId}, 'Invalid workspace'));
  }

  const contact = await findContactByEmail(email, tenantId);

  const registrationError = error(
    await getTranslation(
      {tenant: tenantId, locale},
      'Registration not allowed',
    ),
  );

  if (!contact) return registrationError;

  if (contact.isActivatedOnPortal) return registrationError;

  if (!contact?.isAllowedToRegister) return registrationError;

  const contactPartner =
    contact?.mainPartner &&
    (await findPartnerById(contact.mainPartner?.id, tenantId));

  if (!contactPartner) return registrationError;

  const isContactPartnerAlreadyRegistered = contactPartner?.isActivatedOnPortal;

  const companyRegistrationError = error(
    await getTranslation(
      {
        locale,
        tenant: tenantId,
      },
      'You are trying to create an account for an existing company, please contact admin to invite you as a user',
    ),
  );

  if (isContactPartnerAlreadyRegistered) return companyRegistrationError;

  const existingAdminContact: any = await findActiveAdminContactForWorkspace({
    url: workspaceURL,
    tenantId,
    partnerId: contactPartner.id,
  });

  if (existingAdminContact?.id || existingAdminContact?.error) {
    return companyRegistrationError;
  }

  const localization = await findRegistrationLocalization({locale, tenantId});

  if (password && password.length < 8) {
    return {
      success: false,
      error: await getTranslation(
        {tenant: tenantId},
        'Password must be at least 8 characters',
      ),
    };
  }

  if (password) {
    const isCompany = type === UserType.company;
    const $name = isCompany ? companyName : name;
    const $firstName = isCompany ? companyName : firstName;
    try {
      await withMattermostSync({
        tenantId,
        email,
        password,
        name: $name || '',
        firstName: $firstName || '',
        context: REGISTER_CONTACT,
      });
    } catch (err: any) {
      console.log(err);
      return {
        message: await getTranslation(
          {locale, tenant: tenantId},
          'Error registering, try again',
        ),
        success: false,
      };
    }
  }

  try {
    const contactConfig = await client.aOSPortalContactWorkspaceConfig.create({
      data: {
        name: `${email}-contact-config`,
        portalWorkspace: {
          select: {
            id: workspace.id,
          },
        },
        isAdmin: true,
      },
      select: {id: true},
    });

    if (!contactConfig?.id) return registrationError;

    let result;

    try {
      const isCompany = type === UserType.company;
      const $name = isCompany ? companyName : name;

      result = await client.aOSPartner.update({
        data: {
          id: contact.id,
          version: contact.version,
          registrationCode: identificationNumber,
          fixedPhone: companyNumber,
          name: $name,
          firstName,
          password: password && (await hash(password)),
          fullName: `${$name} ${firstName || ''}`,
          simpleFullName: `${$name} ${firstName || ''}`,
          isActivatedOnPortal: true,
          localization: localization?.id
            ? {select: {id: localization.id}}
            : undefined,
          contactWorkspaceConfigSet: {select: [{id: contactConfig.id}]},
          ...(contactPartner.defaultWorkspace?.id && {
            defaultWorkspace: {
              select: {id: contactPartner.defaultWorkspace.id},
            },
          }),
        },
        select: {id: true},
      });
    } catch (err) {
      return registrationError;
    }

    const $contact = result?.id && (await findContactById(result.id, tenantId));

    if ($contact) {
      return {
        success: true,
        message: await getTranslation(
          {locale, tenant: tenantId},
          'Registered successfully',
        ),
      };
    } else {
      await client.aOSPortalContactWorkspaceConfig.delete({
        id: contactConfig.id,
        version: contactConfig.version,
      });
    }
  } catch (err) {}

  return error(
    await getTranslation(
      {locale, tenant: tenantId},
      'Error registering, try again',
    ),
  );
}
async function findActiveAdminContactForWorkspace({
  url,
  partnerId,
  tenantId,
}: {
  url: PortalWorkspace['url'];
  partnerId: Partner['id'];
  tenantId: Tenant['id'];
}) {
  if (!tenantId) return error(await getTranslation({}, 'TenantId is required'));

  if (!url)
    return error(
      await getTranslation({tenant: tenantId}, 'Workspace is required'),
    );

  const workspace = await findWorkspaceByURL({url, tenantId});

  if (!workspace)
    return error(await getTranslation({tenant: tenantId}, 'Invalid workspace'));

  const client = await manager.getClient(tenantId);

  if (!client)
    return error(await getTranslation({tenant: tenantId}, 'Invalid tenant'));

  return client.aOSPartner.findOne({
    where: {
      isActivatedOnPortal: true,
      isContact: true,
      contactWorkspaceConfigSet: {
        isAdmin: true,
        portalWorkspace: {
          url,
        },
      },
      mainPartner: {id: partnerId},
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function registerByKeycloak({
  locale,
  tenantId,
  email,
  name,
  workspaceURI,
}: {
  tenantId: Tenant['id'];
  locale?: string;
  email: string;
  name?: string;
  workspaceURI: string;
}) {
  const workspaceURL = `${getGooveeEnvironment().GOOVEE_PUBLIC_HOST}${workspaceURI}`;
  const localization = await findRegistrationLocalization({
    locale,
    tenantId,
  });

  try {
    await registerPartner({
      type: UserType.company,
      email,
      companyName: name || email,
      workspaceURL,
      tenantId,
      localizationId: localization?.id,
    } as any);

    return {
      success: true,
      message: await getTranslation(
        {locale, tenant: tenantId},
        'Registered successfully',
      ),
    };
  } catch (err) {
    return error(
      await getTranslation(
        {locale, tenant: tenantId},
        'Error registering, try again',
      ),
    );
  }
}
