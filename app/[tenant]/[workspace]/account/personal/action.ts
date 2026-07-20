'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {manager} from '@/lib/core/tenant';
import {getSession} from '@/auth';
import {TENANT_HEADER} from '@/proxy';
import {getTranslation, t} from '@/locale/server';
import {getPartnerId} from '@/utils';
import {redeemUpload} from '@/lib/core/upload/staged-upload';
import {
  PartnerTypeMap,
  findGooveeUserByEmail,
  findPartnerById,
  updatePartner,
} from '@/orm/partner';
import {UserType} from '@/auth/types';
import {generateOTP} from '@/otp/actions';
import {findOne, isValid, markUsed} from '@/otp/orm';
import {Scope} from '@/otp/constants';
import {findWorkspace} from '@/orm/workspace';
import {withMattermostEmailSync} from '@/lib/core/mattermost';
import {z} from 'zod';
import {
  EmailUpdateOTPSchema,
  type EmailUpdateOTP,
} from '@/lib/core/auth/validation-utils';
import {
  UpdatePersonalSchema,
  type UpdatePersonal,
  UpdateProfileImageSchema,
  type UpdateProfileImage,
} from '../common/utils/validators';
import {PARTNER_PICTURE_PURPOSE} from '../common/constants';
import {getAccountConfig} from '../common/orm/config';

function error(message: string) {
  return {
    error: true,
    message,
  };
}

export async function updateProfileImage(input: UpdateProfileImage) {
  const validation = UpdateProfileImageSchema.safeParse(input);

  if (!validation.success) {
    return error(z.prettifyError(validation.error));
  }

  const {token} = validation.data;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('TenantId is required'));
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return error(await t('Invalid tenant'));
  const {client} = tenant;

  const partner = await findGooveeUserByEmail(user.email, client);

  if (!partner) {
    return error(await t('Invalid partner'));
  }

  try {
    let uploadedId: string | null = null;

    if (token) {
      /* Redeem the staged upload and link it to the partner in one
       * transaction, so a failed link rolls the claim consumption back. */
      uploadedId = await client.$transaction(async txClient => {
        const metaFileId = await redeemUpload({
          token,
          purpose: PARTNER_PICTURE_PURPOSE,
          owner: user.id,
          client: txClient,
        });

        await updatePartner({
          data: {
            id: partner.id,
            version: partner.version,
            picture: {select: {id: metaFileId}},
          },
          client: txClient,
        });

        return metaFileId;
      });
    } else {
      await updatePartner({
        data: {
          id: partner.id,
          version: partner.version,
          picture: {select: {id: null}},
        },
        client,
      });
    }

    return {
      success: true,
      data: uploadedId ? {id: uploadedId} : null,
    };
  } catch (err) {
    return error(await t('Error updating profile picture. Try again.'));
  }
}

export async function fetchPersonalSettings() {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('TenantId is required'));
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return error(await t('Invalid tenant'));
  const {client} = tenant;

  const partner = await findGooveeUserByEmail(user.email, client);

  if (!partner) {
    return error(await t('Invalid partner'));
  }

  const {
    partnerTypeSelect,
    name,
    registrationCode,
    fixedPhone,
    firstName,
    emailAddress,
  } = partner;

  const type = Object.entries(PartnerTypeMap).find(
    ([key, value]) => value === partnerTypeSelect,
  )?.[0];

  return {
    type,
    companyName: name,
    identificationNumber: registrationCode,
    companyNumber: fixedPhone,
    firstName,
    name,
    email: emailAddress?.address,
  };
}

export async function update(data: UpdatePersonal) {
  const validation = UpdatePersonalSchema.safeParse(data);

  if (!validation.success) {
    return error(z.prettifyError(validation.error));
  }

  const {
    companyName,
    identificationNumber,
    companyNumber,
    firstName,
    name,
    email: inputEmail,
    otp,
    mainPartner,
    linkedInLink,
  } = validation.data;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('TenantId is required'));
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return error(await t('Invalid tenant'));
  const {client} = tenant;

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  const email = inputEmail || user.email;

  let otpId: string | undefined;

  if (inputEmail && user.email !== inputEmail) {
    if (!otp) {
      return error(await t('OTP is required'));
    }

    const otpResult = await findOne({
      scope: Scope.EmailUpdate,
      entity: inputEmail!,
      client,
    });

    if (!otpResult) {
      return error(await getTranslation({tenant: tenantId}, 'Invalid OTP'));
    }

    if (!(await isValid({id: otpResult.id, value: otp, client}))) {
      return error(await getTranslation({tenant: tenantId}, 'Invalid OTP'));
    }

    otpId = otpResult.id;
  }

  const partner = await findGooveeUserByEmail(user.email, client);

  if (!partner) {
    return error(await t('Invalid partner'));
  }

  const isCompany =
    partner.partnerTypeSelect === PartnerTypeMap[UserType.company];

  const isPrivateIndividual =
    partner.partnerTypeSelect === PartnerTypeMap[UserType.individual];

  if (isCompany && !companyName) {
    return error(await t('Company Name is required'));
  }

  if (isPrivateIndividual && !name) {
    return error(await t('Last Name is required'));
  }

  const existingPartner = await findGooveeUserByEmail(email, client);

  if (existingPartner) {
    if (existingPartner.id !== partner.id)
      return error(await t('Email already exists'));
  }

  const partners =
    (partner.isContact &&
      partner.contactWorkspaceConfigSet
        ?.map(config => config.partner)
        ?.filter(Boolean)
        ?.map((partner: any) => ({id: partner.id, name: partner.name}))) ||
    [];

  if (partner.isContact && mainPartner) {
    const isValidMainPartner = partners?.find(
      p => String(p.id) === String(mainPartner),
    );

    if (!isValidMainPartner) {
      return error(await t('Invalid partner'));
    }
  }

  const isEmailChanging = email !== partner?.emailAddress?.address;

  if (isEmailChanging) {
    try {
      await withMattermostEmailSync({
        oldEmail: partner.emailAddress!.address!,
        newEmail: email,
        config: tenant.config,
      });
    } catch (err: any) {
      return {
        message: await t('Error updating email. Try again.'),
        success: false,
      };
    }
  }

  try {
    await client.$transaction(async txClient => {
      if (otpId !== undefined) {
        await markUsed({id: otpId, client: txClient});
      }

      await updatePartner({
        data: {
          id: partner.id,
          version: partner.version,
          registrationCode: identificationNumber,
          fixedPhone: companyNumber,
          firstName,
          name: isCompany ? companyName : name,
          linkedinLink: isCompany ? undefined : linkedInLink,
          ...(partner.isContact && mainPartner
            ? {
                mainPartner: {
                  select: {
                    id: mainPartner,
                  },
                },
              }
            : {}),
        },
        client: txClient,
      });

      if (isEmailChanging && partner.emailAddress) {
        const {id, version} = partner.emailAddress;
        await txClient.aOSEmailAddress.update({
          data: {
            id,
            version,
            name: email,
            address: email,
          },
          select: {id: true},
        });
      }
    });

    return {
      success: true,
      message: await t('Settings updated successfully.'),
    };
  } catch (err) {
    return error(await t('Error updating settings. Try again.'));
  }
}

export async function generateOTPForUpdate(data: EmailUpdateOTP) {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('TenantId is required'));
  }

  const validation = EmailUpdateOTPSchema.safeParse(data);

  if (!validation.success) {
    return error(z.prettifyError(validation.error));
  }

  const {email, workspaceURL} = validation.data;

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return error(await t('Invalid tenant'));
  const {client} = tenant;

  const $user = await findPartnerById(user.id!, client);

  if (!$user) {
    return error(await t('Bad request'));
  }

  const partnerId = getPartnerId(user);

  const partner = await findPartnerById(partnerId!, client);

  if (!partner) {
    return error(await t('Bad request'));
  }

  const workspace = await findWorkspace({
    url: workspaceURL,
    client,
    user,
  });

  if (!workspace) {
    return error(await t('Bad request'));
  }

  const config = await getAccountConfig(workspace.config.id, client);

  if (!config) {
    return error(await t('Bad request'));
  }

  if (!config.otpTemplateList?.length) {
    return generateOTP({
      email,
      scope: Scope.EmailUpdate,
      tenantId,
      client,
    });
  } else {
    const {otpTemplateList} = config;

    const localization =
      $user?.localization?.code || partner?.localization?.code;

    let template =
      localization &&
      otpTemplateList?.find((t: any) => t?.localization?.code === localization);

    if (!template) {
      template = otpTemplateList?.[0];
    }

    if (!template?.template) {
      return {
        error: true,
        message: 'Template not found',
      };
    }

    return generateOTP({
      email,
      scope: Scope.EmailUpdate,
      tenantId,
      client,
      mailConfig: {
        template: {
          subject: template.template.subject ?? '',
          content: template.template.content ?? '',
        },
      },
    });
  }
}
