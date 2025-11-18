'use server';
import fs from 'fs';
import path from 'path';
import {pipeline, Readable} from 'stream';
import {promisify} from 'util';
import {getSession} from '@/lib/core/auth';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/middleware';
import {
  findGooveeUserByEmail,
  isAdminContact,
  updatePartner,
} from '@/orm/partner';
import {ActionResponse} from '@/types/action';
import {headers} from 'next/headers';
import {DirectorySettingsFormValues, directorySettingsSchema} from './schema';
import {findWorkspace} from '@/orm/workspace';
import {manager} from '@/lib/core/tenant';
import {getFileSizeText} from '@/utils/files';
import {zodParseFormData} from '@/utils/formdata';
import {z} from 'zod';
import {clone} from '@/utils';

export async function updateDirectorySettings({
  values,
  workspaceURL,
}: {
  values: DirectorySettingsFormValues;
  workspaceURL: string;
}): ActionResponse<null> {
  try {
    const tenantId = headers().get(TENANT_HEADER);

    const session = await getSession();
    if (!session || !session.user) {
      return {error: true, message: await t('Unauthorized')};
    }
    const user = session.user;

    if (!tenantId) {
      return {error: true, message: await t('Tenant not found')};
    }

    const workspace = await findWorkspace({
      user,
      url: workspaceURL,
      tenantId,
    });

    if (!workspace) {
      return {
        error: true,
        message: await t('Invalid workspace'),
      };
    }

    const {success, data} = directorySettingsSchema.safeParse(values);

    if (!success) {
      return {error: true, message: await t('Invalid data')};
    }

    const isPartnerUser = !user.isContact;
    const isAdminContactUser = Boolean(
      await isAdminContact({
        tenantId: tenantId,
        workspaceURL,
      }),
    );

    const partner = await findGooveeUserByEmail(session.user.email!, tenantId);
    if (!partner) {
      return {error: true, message: await t('Partner not found')};
    }

    const canUpdateCompany = isPartnerUser || isAdminContactUser;
    const companyPartner = isPartnerUser ? partner : partner.mainPartner;
    const canUpdateContact = user.isContact;

    if (canUpdateCompany && companyPartner) {
      await updatePartner({
        tenantId,
        data: {
          id: companyPartner.id,
          version: companyPartner.version,
          isInDirectory: data.companyInDirectory,
          isEmailInDirectory: data.companyEmail,
          isPhoneInDirectory: data.companyPhone,
          isWebsiteInDirectory: data.companyWebsite,
          isAddressInDirectory: data.companyAddress,
          directoryCompanyDescription: data.companyDescription,
        },
      });
    }

    if (canUpdateContact) {
      await updatePartner({
        tenantId,
        data: {
          id: partner.id,
          version: partner.version,
          isInDirectory: data.contactInDirectory,
          isFunctionInDirectory: data.contactFunction,
          isEmailInDirectory: data.contactEmail,
          isPhoneInDirectory: data.contactPhone,
          isLinkedinInDirectory: data.contactLinkedin,
        },
      });
    }
    return {success: true, data: null};
  } catch (e) {
    console.error(e);
    return {error: true, message: await t('An unexpected error occurred')};
  }
}

const pump = promisify(pipeline);

const storage = process.env.DATA_STORAGE as string;

if (!fs.existsSync(storage)) {
  fs.mkdirSync(storage);
}

export async function updateCompanyProfileImage(
  formData: FormData,
): ActionResponse<{id: string} | null> {
  const {workspaceURL, picture} = zodParseFormData(
    formData,
    z.object({
      picture: z.instanceof(File).nullish(),
      workspaceURL: z.string(),
    }),
  );

  if (!workspaceURL)
    return {error: true, message: await t('Workspace URL is required')};

  const tenantId = headers().get(TENANT_HEADER);

  const session = await getSession();
  if (!session || !session.user) {
    return {error: true, message: await t('Unauthorized')};
  }
  const user = session.user;

  if (!tenantId) {
    return {error: true, message: await t('Tenant not found')};
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const isAdminContactUser = Boolean(
    await isAdminContact({
      tenantId: tenantId,
      workspaceURL,
    }),
  );

  if (!isAdminContactUser) {
    return {error: true, message: await t('Unauthorized')};
  }

  const partner = await findGooveeUserByEmail(session.user.email!, tenantId);
  if (!partner) {
    return {error: true, message: await t('Partner not found')};
  }

  const companyPartner = partner.mainPartner;
  if (!companyPartner) {
    return {error: true, message: await t('Company not found')};
  }
  const client = await manager.getClient(tenantId);

  if (!client) {
    return {error: true, message: await t('Invalid tenant')};
  }

  let uploadedPicture = null;

  if (picture) {
    try {
      const fileName = `${new Date().getTime()}-${picture.name}`;

      await pump(
        Readable.fromWeb(picture.stream() as any),
        fs.createWriteStream(path.resolve(storage, fileName)),
      );

      uploadedPicture = await client.aOSMetaFile
        .create({
          data: {
            fileName: picture.name,
            filePath: fileName,
            fileType: picture.type,
            fileSize: String(picture.size),
            sizeText: getFileSizeText(picture.size),
            description: '',
          },
          select: {id: true},
        })
        .then(clone);
    } catch (err) {
      return {
        error: true,
        message: await t('Error updating profile picture. Try again.'),
      };
    }
  }

  try {
    await updatePartner({
      data: {
        id: companyPartner.id,
        version: companyPartner.version,
        ...(uploadedPicture
          ? {
              picture: {
                select: {
                  id: uploadedPicture.id,
                },
              },
            }
          : {
              picture: {select: {id: null}},
            }),
      },
      tenantId,
    });
  } catch (err) {
    return {
      error: true,
      message: await t('Error updating profile picture. Try again.'),
    };
  }

  return {
    success: true,
    data: uploadedPicture,
  };
}
