'use server';
import {getSession} from '@/lib/core/auth';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/middleware';
import {
  findGooveeUserByEmail,
  isAdminContact,
  isPartner,
  updatePartner,
} from '@/orm/partner';
import {ActionResponse} from '@/types/action';
import {headers} from 'next/headers';
import {DirectorySettingsFormValues, directorySettingsSchema} from './schema';

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

    if (!tenantId) {
      return {error: true, message: await t('Tenant not found')};
    }

    const {success, data} = directorySettingsSchema.safeParse(values);

    if (!success) {
      return {error: true, message: await t('Invalid data')};
    }

    const isPartnerUser = Boolean(await isPartner());
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
    const canUpdateContact = partner.isContact;

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
