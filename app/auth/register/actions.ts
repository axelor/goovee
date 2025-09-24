'use server';

import {revalidatePath} from 'next/cache';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {UserType} from '@/auth/types';
import {
  findContactByEmail,
  findContactById,
  findGooveeUserByEmail,
  findPartnerByEmail,
  findPartnerById,
  registerPartner,
  updatePartner,
} from '@/orm/partner';
import {
  findDefaultPartnerWorkspaceConfig,
  findWorkspaceByURL,
  findWorkspaces,
} from '@/orm/workspace';
import {getTranslation} from '@/locale/server';
import {manager, type Tenant} from '@/tenant';
import type {Partner, PortalWorkspace} from '@/types';
import {
  ALLOW_ALL_REGISTRATION,
  ALLOW_AOS_ONLY_REGISTRATION,
  ALLOW_NO_REGISTRATION,
} from '@/constants';
import {findOne, isValid} from '@/otp/orm';
import {Scope} from '@/otp/constants';
import {findRegistrationLocalization} from '@/orm/localizations';
import {hash} from '@/auth/utils';

function error(message: string) {
  return {
    error: true,
    message,
  };
}

export async function subscribe({
  workspace,
  tenantId,
}: {
  workspace: PortalWorkspace;
  tenantId?: Tenant['id'] | null;
}) {
  const session = await getSession();
  const user = session?.user;

  if (!(workspace && tenantId)) {
    return error(await getTranslation({}, 'Bad request'));
  }

  if (!user) {
    return error(await getTranslation({}, 'Unauthorized'));
  }

  const url = workspace?.url;

  const userWorkspaces = await findWorkspaces({url, user, tenantId});

  const existing = userWorkspaces?.find((w: any) => w.id === workspace?.id);

  if (existing) {
    return error(await getTranslation({}, 'Already subscribed'));
  }

  const defaultPartnerWorkspaceConfig = await findDefaultPartnerWorkspaceConfig(
    {url, tenantId},
  );

  if (!defaultPartnerWorkspaceConfig) {
    return error(
      await getTranslation(
        {},
        'Cannot subscribe, no default permissions available for the workspace',
      ),
    );
  }

  const client = await manager.getClient(tenantId);

  const $user = await client.aOSPartner.findOne({
    where: {
      id: user.id,
    },
    select: {
      isContact: true,
      mainPartner: {
        id: true,
      },
    },
  });

  if (!$user) {
    return error(await getTranslation({}, 'Bad request'));
  }

  if (!$user.isContact) {
    try {
      await client.aOSPartner.update({
        data: {
          id: $user.id,
          version: $user.version,
          partnerWorkspaceSet: {
            select: [
              {
                id: defaultPartnerWorkspaceConfig.id,
              },
            ],
          },
        },
      });

      revalidatePath('/', 'layout');

      return {
        success: true,
        message: await getTranslation({}, 'Successfully subscribed'),
      };
    } catch (err) {}
  } else {
    const {mainPartner} = $user;

    if (!mainPartner?.id) {
      return error(
        await getTranslation({}, 'Partner not available for the contact'),
      );
    }
    const partnerWorkspaces = await findWorkspaces({
      url,
      user: {
        id: $user.mainPartner.id!,
        isContact: false,
      } as any,
      tenantId,
    });

    const existsInPartner = partnerWorkspaces.find((w: any) => w.url === url);

    if (!existsInPartner) {
      return error(
        await getTranslation(
          {},
          `Partner didn't have access to workspace, cannot subscribe`,
        ),
      );
    } else {
      try {
        await client.aOSPartner.update({
          data: {
            id: $user.id,
            version: $user.version,
            contactWorkspaceConfigSet: {
              create: [
                {
                  name: `${user.name}-${url}`,
                  portalWorkspace: {
                    select: [
                      {
                        id: workspace.id,
                      },
                    ],
                  },
                },
              ],
            },
          },
        });

        revalidatePath('/', 'layout');

        return {
          success: true,
          message: await getTranslation({}, 'Successfully subscribed'),
        };
      } catch (err) {
        console.log(err);
      }
    }
  }

  return error(await getTranslation({}, 'Error subscribing, try again'));
}

type RegisterDTO = {
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

  const aosPartner = await findPartnerByEmail(email, tenantId);
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

export async function registerByEmail(data: RegisterDTO) {
  const {email, password, confirmPassword, otp, tenantId} = data;

  if (!tenantId) {
    return error(await getTranslation({}, 'Bad request'));
  }

  if (!(email && password && confirmPassword)) {
    return error(
      await getTranslation(
        {tenant: tenantId},
        'Email and password are required.',
      ),
    );
  }

  if (password !== confirmPassword) {
    return error(
      await getTranslation(
        {tenant: tenantId},
        'Password and confirm password mismatch.',
      ),
    );
  }

  if (!otp) {
    return error(await getTranslation({tenant: tenantId}, 'OTP is required'));
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

  return register(data);
}

export async function registerByGoogle(
  data: Omit<RegisterDTO, 'password' | 'confirmPassword' | 'email' | 'otp'>,
) {
  const {tenantId} = data;

  if (!tenantId) {
    return error(await getTranslation({}, 'Bad request'));
  }

  const session = await getSession();
  const user = session?.user;

  if (!user?.email) {
    return error(
      await getTranslation(
        {tenant: tenantId},
        'Login using google and try again.',
      ),
    );
  }

  return register({...data, email: user.email});
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

  const isContactPartnerAlreadyRegistered = contactPartner?.password;

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
          defaultWorkspace: {select: [{id: contactConfig.id}]},
        },
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
  partnerId?: Partner['id'];
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
      ...(partnerId ? {mainPartner: {id: partnerId}} : {}),
    },
    select: {
      id: true,
      name: true,
    },
  });
}
