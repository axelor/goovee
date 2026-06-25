import {type OAuthInviteRegister, type OAuthRegister} from './validation-utils';

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
import {getTranslation} from '../locale/server';
import {UserType} from './types';
import {withBasePath} from '@/lib/core/path/base-path';
import {toWorkspaceURI} from '@/utils/workspace';
import {type Tenant, type TenantConfig} from '../tenant';
import type {Partner} from '@/types';
import type {WorkspaceLight} from '@/orm/workspace';
import {hash} from './utils';
import {getPublicEnvironment} from '../environment/utils';
import {withMattermostSync} from '../mattermost/user-api';
import type {Client} from '@/goovee/.generated/client';

export type RegisterInviteDTO = OAuthInviteRegister & {
  password?: string;
  client: Client;
  config: TenantConfig;
};

export async function registerByInvite({
  firstName,
  name,
  email,
  password,
  tenantId,
  inviteId,
  locale,
  client,
  config,
}: RegisterInviteDTO): Promise<{query: string}> {
  const invite = await findInviteById({id: inviteId, client});

  if (!invite) {
    throw new Error(await getTranslation({tenant: tenantId}, 'Invalid invite'));
  }

  if (!invite?.partner?.id) {
    throw new Error(
      await getTranslation(
        {tenant: tenantId},
        'No partner available for the workspace',
      ),
    );
  }

  if (email !== invite.emailAddress?.address) {
    throw new Error(
      await getTranslation(
        {tenant: tenantId},
        'This invitation is valid only for the email address it was sent to.',
      ),
    );
  }

  const {workspace} = invite;

  if (!workspace) {
    throw new Error(
      await getTranslation({tenant: tenantId}, 'Invalid workspace'),
    );
  }

  const gooveeUser = await findGooveeUserByEmail(email, client);

  if (gooveeUser) {
    throw new Error(
      await getTranslation(
        {tenant: tenantId},
        'Already registered, try login and subscribing invite',
      ),
    );
  }

  const existingRecord = await findContactByEmail(email, client);

  if (
    existingRecord &&
    existingRecord.mainPartner &&
    existingRecord.mainPartner.id !== invite.partner.id
  ) {
    throw new Error(
      await getTranslation(
        {tenant: tenantId},
        'Contact already exists with another partner.',
      ),
    );
  }

  const contactConfig = invite?.contactAppPermissionList?.[0];

  let localization = invite.partner?.localization;

  if (!localization) {
    localization = await findRegistrationLocalization({locale, client});
  }

  if (password) {
    try {
      await withMattermostSync({
        config,
        email,
        password,
        name,
        firstName,
        context: INVITE_REGISTER,
      });
    } catch (err: any) {
      throw new Error(
        await getTranslation(
          {tenant: tenantId},
          'Error registering contact. Try again.',
        ),
      );
    }
  }

  try {
    await registerContact({
      email,
      name,
      firstName,
      password,
      client,
      contactConfig,
      existingRecord,
      partnerId: invite.partner.id,
      localizationId: localization?.id,
    });

    const uri = toWorkspaceURI(workspace.url, process.env.GOOVEE_PUBLIC_HOST);

    revalidatePath('/', 'layout');

    deleteInviteById({
      id: invite.id,
      client,
    }).catch(err => {
      console.error(err);
    });

    return {
      query: `?callbackurl=${encodeURIComponent(`${workspace.url}/`)}&workspaceURI=${encodeURIComponent(`${uri}/`)}&tenant=${tenantId}`,
    };
  } catch (err) {
    throw new Error(
      await getTranslation(
        {tenant: tenantId},
        'Error registering contact. Try again.',
      ),
    );
  }
}

export type RegisterDTO = OAuthRegister & {
  password?: string;
  client: Client;
  config: TenantConfig;
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
  client,
  config,
}: RegisterDTO): Promise<void> {
  const isCompany = type === UserType.company;

  if (isCompany && !companyName) {
    throw new Error(
      await getTranslation({tenant: tenantId}, 'Company name is required'),
    );
  }

  const workspace = await findWorkspaceByURL({url: workspaceURL, client});

  if (!workspace) {
    throw new Error(
      await getTranslation({tenant: tenantId}, 'Invalid workspace'),
    );
  }

  const registrationScope = workspace.allowRegistrationSelect;

  if (!registrationScope || registrationScope === ALLOW_NO_REGISTRATION) {
    throw new Error(
      await getTranslation({tenant: tenantId}, 'Registration not allowed'),
    );
  }

  const existingUser = await findGooveeUserByEmail(email, client);

  if (existingUser) {
    throw new Error(
      await getTranslation({tenant: tenantId}, 'Account already exists'),
    );
  }

  let aosPartner = await findPartnerByEmail(email, client);
  if (aosPartner) {
    // there could be multiple partners with the same email, so we preferrably take the one that is allowed to register
    const allowedPartner = await findPartnerAllowedToRegister(email, client);
    if (allowedPartner) {
      aosPartner = allowedPartner;
    }
  }

  const isAosContact = aosPartner?.isContact;
  const isAosPartner = !isAosContact;

  const isAllowedToRegister = aosPartner?.isAllowedToRegister;

  const registrationErrorMessage = await getTranslation(
    {tenant: tenantId},
    'Registration not allowed',
  );

  const companyRegistrationErrorMessage = await getTranslation(
    {
      locale,
      tenant: tenantId,
    },
    'You are trying to create an account for an existing company, please contact admin to invite you as a user',
  );

  if (registrationScope === ALLOW_AOS_ONLY_REGISTRATION) {
    if (!aosPartner) {
      throw new Error(registrationErrorMessage);
    } else if (isAosPartner) {
      if (!isAllowedToRegister) throw new Error(registrationErrorMessage);
      const existingAdminContact = await findActiveAdminContactForWorkspace({
        url: workspaceURL,
        tenantId,
        partnerId: aosPartner.id,
        client,
      });

      if (existingAdminContact?.id) {
        throw new Error(companyRegistrationErrorMessage);
      }
      /** Register */
    } else if (isAosContact) {
      if (!isAllowedToRegister) throw new Error(registrationErrorMessage);
      if (!aosPartner?.mainPartner) {
        await transformAosContactAsPartner(aosPartner.id, client, tenantId);
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
          client,
          config,
        });
      }
    } else {
    }
  } else if (registrationScope === ALLOW_ALL_REGISTRATION) {
    if (!aosPartner) {
      /** Register */
    } else if (isAosPartner) {
      const existingAdminContact = await findActiveAdminContactForWorkspace({
        url: workspaceURL,
        tenantId,
        partnerId: aosPartner.id,
        client,
      });

      if (existingAdminContact?.id) {
        throw new Error(companyRegistrationErrorMessage);
      }

      /** Register */
    } else if (isAosContact) {
      if (!aosPartner?.mainPartner) {
        await transformAosContactAsPartner(
          aosPartner.id,
          client,
          tenantId,
          locale,
        );
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
          client,
          config,
        });
      }
    } else {
    }
  }

  const localization = await findRegistrationLocalization({locale, client});

  if (password) {
    const isCompany = type === UserType.company;
    const $name = isCompany ? companyName : name;
    const $firstName = isCompany ? companyName : firstName;
    try {
      await withMattermostSync({
        config,
        email,
        password,
        name: $name || '',
        firstName: $firstName || '',
        context: REGISTER,
      });
    } catch (err: any) {
      throw new Error(
        await getTranslation(
          {locale, tenant: tenantId},
          'Error registering, try again',
        ),
      );
    }
  }

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
    client,
    localizationId: localization?.id,
  });

  const $partner = partner?.id && (await findPartnerById(partner.id, client));

  if (!$partner) {
    throw new Error(
      await getTranslation(
        {locale, tenant: tenantId},
        'Error registering, try again',
      ),
    );
  }
}

async function transformAosContactAsPartner(
  id: string,
  client: Client,
  tenantId: Tenant['id'],
  locale?: string,
): Promise<void> {
  if (!id)
    throw new Error(
      await getTranslation({tenant: tenantId, locale}, 'Bad Request'),
    );

  const contact = await findContactById(id, client);

  if (!contact)
    throw new Error(
      await getTranslation({tenant: tenantId, locale}, 'Bad Request'),
    );

  try {
    await updatePartner({
      data: {
        id: contact.id,
        version: contact.version,
        isContact: false,
      },
      client,
    });
  } catch (err) {
    throw new Error(
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
  client,
  config,
}: RegisterDTO): Promise<void> {
  const workspace = await findWorkspaceByURL({url: workspaceURL, client});

  if (!workspace) {
    throw new Error(
      await getTranslation({tenant: tenantId}, 'Invalid workspace'),
    );
  }

  const contact = await findContactByEmail(email, client);

  const registrationErrorMessage = await getTranslation(
    {tenant: tenantId, locale},
    'Registration not allowed',
  );

  if (!contact) throw new Error(registrationErrorMessage);

  if (contact.isActivatedOnPortal) throw new Error(registrationErrorMessage);

  if (!contact?.isAllowedToRegister) throw new Error(registrationErrorMessage);

  const contactPartner =
    contact?.mainPartner &&
    (await findPartnerById(contact.mainPartner?.id, client));

  if (!contactPartner) throw new Error(registrationErrorMessage);

  const isContactPartnerAlreadyRegistered = contactPartner?.isActivatedOnPortal;

  const companyRegistrationErrorMessage = await getTranslation(
    {
      locale,
      tenant: tenantId,
    },
    'You are trying to create an account for an existing company, please contact admin to invite you as a user',
  );

  if (isContactPartnerAlreadyRegistered)
    throw new Error(companyRegistrationErrorMessage);

  const existingAdminContact: any = await findActiveAdminContactForWorkspace({
    url: workspaceURL,
    tenantId,
    partnerId: contactPartner.id,
    client,
  });

  if (existingAdminContact?.id) {
    throw new Error(companyRegistrationErrorMessage);
  }

  const localization = await findRegistrationLocalization({locale, client});

  if (password) {
    const isCompany = type === UserType.company;
    const $name = isCompany ? companyName : name;
    const $firstName = isCompany ? companyName : firstName;
    try {
      await withMattermostSync({
        config,
        email,
        password,
        name: $name || '',
        firstName: $firstName || '',
        context: REGISTER_CONTACT,
      });
    } catch (err: any) {
      console.log(err);
      throw new Error(
        await getTranslation(
          {locale, tenant: tenantId},
          'Error registering, try again',
        ),
      );
    }
  }

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

  if (!contactConfig?.id) throw new Error(registrationErrorMessage);

  const isCompany = type === UserType.company;
  const $name = isCompany ? companyName : name;

  const result = await client.aOSPartner.update({
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

  const $contact = result?.id && (await findContactById(result.id, client));

  if (!$contact) {
    await client.aOSPortalContactWorkspaceConfig.delete({
      id: contactConfig.id,
      version: contactConfig.version,
    });
    throw new Error(
      await getTranslation(
        {locale, tenant: tenantId},
        'Error registering, try again',
      ),
    );
  }
}

async function findActiveAdminContactForWorkspace({
  url,
  partnerId,
  tenantId,
  client,
}: {
  url: WorkspaceLight['url'];
  partnerId: Partner['id'];
  tenantId: Tenant['id'];
  client: Client;
}): Promise<{id: string; name: string | null | undefined} | null | undefined> {
  if (!url)
    throw new Error(
      await getTranslation({tenant: tenantId}, 'Workspace is required'),
    );

  const workspace = await findWorkspaceByURL({url, client});

  if (!workspace)
    throw new Error(
      await getTranslation({tenant: tenantId}, 'Invalid workspace'),
    );

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
  client,
}: {
  tenantId: Tenant['id'];
  locale?: string;
  email: string;
  name?: string;
  workspaceURI: string;
  client: Client;
}): Promise<void> {
  const workspaceURL = `${getPublicEnvironment().GOOVEE_PUBLIC_HOST}${withBasePath(workspaceURI)}`;
  const localization = await findRegistrationLocalization({
    locale,
    client,
  });

  try {
    await registerPartner({
      type: UserType.company,
      email,
      companyName: name || email,
      workspaceURL,
      client,
      localizationId: localization?.id,
    } as any);
  } catch (err) {
    throw new Error(
      await getTranslation(
        {locale, tenant: tenantId},
        'Error registering, try again',
      ),
    );
  }
}
