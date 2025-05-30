'use server';

import {generateOTP as coreGenerateOTP} from '@/otp/actions';
import {t} from '@/locale/server';
import {Scope} from '@/otp/constants';
import {findWorkspace} from '@/orm/workspace';
import {type Tenant} from '@/tenant';
import {findInviteById} from '../../../../common/orm/register';

function error(message: string) {
  return {
    error: true,
    message,
  };
}

export async function generateOTP({
  inviteId,
  tenantId,
}: {
  inviteId: string;
  tenantId: Tenant['id'];
}) {
  if (!(inviteId && tenantId)) {
    return error(await t('Invitation and Tenant is required'));
  }

  const invite = await findInviteById({
    id: inviteId,
    tenantId,
  });

  if (!(invite?.workspace && invite?.partner)) {
    return error(await t('Bad request'));
  }

  const workspace = await findWorkspace({
    url: invite.workspace.url,
    user: {
      id: invite.partner.id,
    } as any,
    tenantId,
  });

  if (!workspace?.config) {
    return error(await t('Bad request'));
  }

  const email = invite?.emailAddress?.address;

  if (!workspace.config.otpTemplateList?.length) {
    return coreGenerateOTP({
      email,
      scope: Scope.Registration,
      tenantId,
    });
  } else {
    const {otpTemplateList} = workspace.config;
    const localization = invite.partner?.localization?.code;

    let template =
      localization &&
      otpTemplateList.find((t: any) => t?.localization?.code === localization);

    if (!template) {
      template = otpTemplateList?.[0];
    }

    return coreGenerateOTP({
      email,
      scope: Scope.Registration,
      tenantId,
      mailConfig: {
        template: template?.template,
      },
    });
  }
}
