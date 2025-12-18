'use server';

import {revalidatePath} from 'next/cache';

import {Tenant} from '@/tenant';
import {getTranslation, t} from '@/locale/server';
import {
  findContactByEmail,
  findGooveeUserByEmail,
  findPartnerByEmail,
  registerContact,
  updatePartner,
} from '@/orm/partner';
import {findRegistrationLocalization} from '@/orm/localizations';
import {deleteInviteById} from '@/app/[tenant]/[workspace]/account/common/orm/invites';
import {getSession} from '@/auth';
import {PortalWorkspace} from '@/types';
import {findOne, isValid} from '@/otp/orm';
import {Scope} from '@/otp/constants';

import {findInviteById} from '../../../common/orm/register';

function error(message: string) {
  return {
    error: true,
    message,
  };
}

type RegisterDTO = {
  firstName: string;
  name: string;
  email: string;
  otp?: string;
  password?: string;
  tenantId: string;
  inviteId: string;
  locale?: string;
};

export async function register({
  firstName,
  name,
  email,
  password,
  tenantId,
  inviteId,
  locale,
}: RegisterDTO) {
  if (!(name && tenantId && inviteId)) {
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
    return error(await t('Bad request'));
  }

  const {workspace} = invite;

  if (!workspace) {
    return error(await 'Invalid workspace');
  }

  const contact = await findContactByEmail(email, tenantId);

  if (contact) {
    return error(await 'Already registered, try login and subscribing invite');
  }

  const contactConfig = invite?.contactAppPermissionList?.[0];

  let localization = invite.partner?.localization;

  if (!localization) {
    localization = await findRegistrationLocalization({locale, tenantId});
  }

  try {
    const contact = await registerContact({
      email,
      name,
      firstName,
      password,
      tenantId,
      contactConfig,
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

export async function registerByEmail(data: RegisterDTO) {
  const {email, password, otp, tenantId} = data;

  if (!tenantId) {
    return error(await t('TenantId is required'));
  }

  if (!(email && password)) {
    return error(await getTranslation({tenant: tenantId}, 'Bad request'));
  }

  if (password.length < 8) {
    return error(
      await getTranslation(
        {tenant: tenantId},
        'Password must be at least 8 characters',
      ),
    );
  }

  if (!otp) {
    return error(await getTranslation({tenant: tenantId}, 'OTP is required.'));
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
  data: Omit<RegisterDTO, 'password' | 'email' | 'otp'>,
) {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Login with google to register'));
  }

  return register({...data, email: user.email});
}

export async function subscribe({
  workspaceURL,
  tenantId,
  inviteId,
}: {
  workspaceURL: PortalWorkspace['url'];
  tenantId?: Tenant['id'] | null;
  inviteId: string;
}) {
  if (!(workspaceURL && inviteId && tenantId)) {
    return error(await t('Bad request'));
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await t('Unauthorized'));
  }

  const invite = await findInviteById({id: inviteId, tenantId});

  if (
    !(
      invite &&
      invite.partner &&
      invite.partner.id &&
      invite.emailAddress?.address === user.email &&
      invite.workspace &&
      invite.workspace.url === workspaceURL
    )
  ) {
    return error(await t('Bad request'));
  }

  const contactConfig = invite?.contactAppPermissionList?.[0];

  if (!contactConfig) {
    return error(await t('Bad request'));
  }

  const $user = await findPartnerByEmail(user.email, tenantId, {
    where: {
      isContact: {
        eq: true,
      },
    },
  });

  if (!$user) {
    return error(await t('User not found'));
  }

  const data = {
    id: $user?.id,
    version: $user.version,
    contactWorkspaceConfigSet: {select: [{id: contactConfig.id}]},
  } as any;

  try {
    const updatedUser = await updatePartner({
      data,
      tenantId,
    });

    revalidatePath('/', 'layout');
  } catch (err) {
    return error(await t('Error subscribing, try again'));
  }

  deleteInviteById({
    id: invite.id,
    tenantId,
  }).catch(err => {
    console.error(err);
  });

  return {
    success: true,
    message: await t('Subscribed successfully.'),
  };
}

export async function fetchUpdatedSession({tenantId}: {tenantId: string}) {
  if (!tenantId) {
    return null;
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const partner = await findGooveeUserByEmail(user.email, tenantId);

  if (!partner) {
    return null;
  }

  return {
    id: partner.id,
    email: user.email,
    tenantId,
  };
}
