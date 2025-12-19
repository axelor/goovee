'use server';

import fs from 'fs';
import path from 'path';
import {pipeline} from 'stream';
import {promisify} from 'util';
import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {manager} from '@/lib/core/tenant';
import {getSession} from '@/auth';
import {TENANT_HEADER} from '@/middleware';
import {getFileSizeText} from '@/utils/files';
import {getTranslation, t} from '@/locale/server';
import {clone, getPartnerId} from '@/utils';
import {
  PartnerTypeMap,
  findGooveeUserByEmail,
  findPartnerById,
  updatePartner,
} from '@/orm/partner';
import {UserType} from '@/auth/types';
import {generateOTP} from '@/otp/actions';
import {findOne, isValid} from '@/otp/orm';
import {Scope} from '@/otp/constants';
import {findWorkspace} from '@/orm/workspace';
import {type PortalWorkspace} from '@/types';

const pump = promisify(pipeline);

const storage = process.env.DATA_STORAGE as string;

if (!fs.existsSync(storage)) {
  fs.mkdirSync(storage);
}

function error(message: string) {
  return {
    error: true,
    message,
  };
}

export async function updateProfileImage(formData: FormData) {
  const file: any = formData.get('picture');

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('TenantId is required'));
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  const partner = await findGooveeUserByEmail(user.email, tenantId);

  if (!partner) {
    return error(await t('Invalid partner'));
  }

  const client = await manager.getClient(tenantId);

  if (!client) {
    return error(await t('Invalid tenant'));
  }

  let uploadedPicture = null;

  if (file) {
    try {
      const fileName = `${new Date().getTime()}-${file.name}`;

      await pump(
        file.stream(),
        fs.createWriteStream(path.resolve(storage, fileName)),
      );

      uploadedPicture = await client.aOSMetaFile
        .create({
          data: {
            fileName: file.name,
            filePath: fileName,
            fileType: file.type,
            fileSize: file.size,
            sizeText: getFileSizeText(file.size),
            description: '',
          },
          select: {id: true},
        })
        .then(clone);
    } catch (err) {
      return error(await t('Error updating profile picture. Try again.'));
    }
  }

  try {
    const updatedPartner = await updatePartner({
      data: {
        id: partner.id,
        version: partner.version,
        ...(uploadedPicture
          ? {
              picture: {
                select: {
                  id: uploadedPicture.id,
                },
              },
            }
          : {
              picture: {
                select: {
                  id: null,
                },
              },
            }),
      },
      tenantId,
    });
  } catch (err) {
    return error(await t('Error updating profile picture. Try again.'));
  }

  return {
    success: true,
    data: uploadedPicture,
  };
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

  const partner = await findGooveeUserByEmail(user.email, tenantId);

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

export async function update({
  companyName,
  identificationNumber,
  companyNumber,
  firstName,
  name,
  email,
  otp,
  mainPartner,
  linkedInLink,
}: {
  companyName?: string;
  identificationNumber?: string;
  companyNumber?: string;
  firstName?: string;
  name: string;
  email: string;
  otp?: string;
  mainPartner?: string;
  linkedInLink?: string;
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('TenantId is required'));
  }

  if (!email) {
    return error(await t('Email is required'));
  }

  const client = await manager.getClient(tenantId);

  if (!client) {
    return error(await t('Bad request'));
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  if (user.email !== email) {
    if (!otp) {
      return error(await t('OTP is required'));
    }

    const otpResult = await findOne({
      scope: Scope.EmailUpdate,
      entity: email,
      tenantId,
    });

    if (!otpResult) {
      return error(await getTranslation({tenant: tenantId}, 'Invalid OTP'));
    }

    if (!(await isValid({id: otpResult.id, value: otp, tenantId}))) {
      return error(await getTranslation({tenant: tenantId}, 'Invalid OTP'));
    }
  }

  const partner = await findGooveeUserByEmail(user.email, tenantId);

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

  const existingPartner = await findGooveeUserByEmail(email, tenantId);

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

  try {
    if (email !== partner?.emailAddress.address) {
      const updateEmail = async (emailAddress: any, newEmail: string) => {
        if (!emailAddress) return;

        const {id, version} = emailAddress;

        await client.aOSEmailAddress.update({
          data: {
            id,
            version,
            name: newEmail,
            address: newEmail,
          },
          select: {id: true},
        });
      };

      await updateEmail(partner?.emailAddress, email);
    }

    const updatedPartner = await updatePartner({
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
      tenantId,
    });

    return {
      success: true,
      message: await t('Settings updated successfully.'),
    };
  } catch (err) {
    return error(await t('Error updating settings. Try again.'));
  }
}

export async function generateOTPForUpdate({
  email,
  workspaceURL,
}: {
  email: string;
  workspaceURL: PortalWorkspace['url'];
}) {
  if (!(email && workspaceURL)) {
    return error(await t('Email and workspace is required'));
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('TenantId is required'));
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  const $user = await findPartnerById(user.id!, tenantId);

  if (!$user) {
    return error(await t('Bad request'));
  }

  const partnerId = getPartnerId(user);

  const partner = await findPartnerById(partnerId!, tenantId);

  if (!partner) {
    return error(await t('Bad request'));
  }

  const workspace =
    workspaceURL &&
    (await findWorkspace({
      url: workspaceURL,
      tenantId,
      user,
    }));

  if (!workspace) {
    return error(await t('Bad request'));
  }

  if (!workspace?.config?.otpTemplateList?.length) {
    return generateOTP({
      email,
      scope: Scope.EmailUpdate,
      tenantId,
    });
  } else {
    const {config} = workspace;
    const {otpTemplateList} = config;

    const localization =
      $user?.localization?.code || partner?.localization?.code;

    let template =
      localization &&
      otpTemplateList.find((t: any) => t?.localization?.code === localization);

    if (!template) {
      template = otpTemplateList?.[0];
    }

    return generateOTP({
      email,
      scope: Scope.EmailUpdate,
      tenantId,
      mailConfig: {
        template: template?.template,
      },
    });
  }
}
