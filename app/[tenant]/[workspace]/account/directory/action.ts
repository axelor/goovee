'use server';
import {getSession} from '@/lib/core/auth';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import {
  findGooveeUserByEmail,
  isAdminContact,
  updatePartner,
} from '@/orm/partner';
import {ActionResponse} from '@/types/action';
import {headers} from 'next/headers';
import {
  DirectorySettingsFormValues,
  directorySettingsSchema,
  updateCompanyProfileImageSchema,
  type UpdateCompanyProfileImageValues,
} from './schema';
import {findWorkspace} from '@/orm/workspace';
import {manager} from '@/lib/core/tenant';
import {redeemUpload} from '@/lib/core/upload/staged-upload';
import {PARTNER_PICTURE_PURPOSE} from '../common/constants';

export async function updateDirectorySettings({
  values,
  workspaceURL,
}: {
  values: DirectorySettingsFormValues;
  workspaceURL: string;
}): ActionResponse<null> {
  try {
    const tenantId = (await headers()).get(TENANT_HEADER);

    const session = await getSession();
    if (!session || !session.user) {
      return {error: true, message: await t('Unauthorized')};
    }
    const user = session.user;

    if (!tenantId) {
      return {error: true, message: await t('Tenant not found')};
    }

    const tenant = await manager.getTenant(tenantId);
    if (!tenant) return {error: true, message: await t('Tenant not found')};
    const {client} = tenant;

    const workspace = await findWorkspace({
      user,
      url: workspaceURL,
      client,
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
        client,
        workspaceURL,
      }),
    );

    const partner = await findGooveeUserByEmail(session.user.email!, client);
    if (!partner) {
      return {error: true, message: await t('Partner not found')};
    }

    const canUpdateCompany = isPartnerUser || isAdminContactUser;
    const companyPartner = isPartnerUser ? partner : partner.mainPartner;
    const canUpdateContact = user.isContact;

    if (canUpdateCompany && companyPartner) {
      await updatePartner({
        client,
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
        client,
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

export async function updateCompanyProfileImage(
  input: UpdateCompanyProfileImageValues,
): ActionResponse<{id: string} | null> {
  const {success, data: parsed} =
    updateCompanyProfileImageSchema.safeParse(input);

  if (!success) {
    return {error: true, message: await t('Invalid data')};
  }

  const {token, workspaceURL} = parsed;

  const tenantId = (await headers()).get(TENANT_HEADER);

  const session = await getSession();
  if (!session || !session.user) {
    return {error: true, message: await t('Unauthorized')};
  }
  const user = session.user;

  if (!tenantId) {
    return {error: true, message: await t('Tenant not found')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Tenant not found')};
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const isAdminContactUser = Boolean(
    await isAdminContact({
      client,
      workspaceURL,
    }),
  );

  if (!isAdminContactUser) {
    return {error: true, message: await t('Unauthorized')};
  }

  const partner = await findGooveeUserByEmail(session.user.email!, client);
  if (!partner) {
    return {error: true, message: await t('Partner not found')};
  }

  const companyPartner = partner.mainPartner;
  if (!companyPartner) {
    return {error: true, message: await t('Company not found')};
  }

  try {
    let uploadedId: string | null = null;

    if (token) {
      /* Redeem the staged upload and link it to the company partner in one
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
            id: companyPartner.id,
            version: companyPartner.version,
            picture: {select: {id: metaFileId}},
          },
          client: txClient,
        });

        return metaFileId;
      });
    } else {
      await updatePartner({
        data: {
          id: companyPartner.id,
          version: companyPartner.version,
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
    return {
      error: true,
      message: await t('Error updating profile picture. Try again.'),
    };
  }
}
