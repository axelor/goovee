'use server';

import {headers} from 'next/headers';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {getSignInMethods} from '@/auth/sign-in-methods';
import {compare, hash} from '@/auth/utils';
import {t} from '@/locale/server';
import {findGooveeUserByEmail} from '@/orm/partner';
import {generateOTP} from '@/otp/actions';
import {Scope} from '@/otp/constants';
import {findOne, isValid, markUsed} from '@/otp/orm';
import {TENANT_HEADER} from '@/proxy';
import {manager} from '@/tenant';
import {withMattermostSync} from '@/mattermost';
import {CHANGE_PASSWORD, SET_PASSWORD} from '@/constants';
import {
  ChangePasswordSchema,
  SetPasswordSchema,
  type ChangePassword,
  type SetPassword,
} from '@/auth/validation-utils';

/* The signed-in user's tenant and portal account, for the actions below. Every
 * one of them sets a password, so a tenant that turns email and password
 * sign-in off is refused here. */
async function findPasswordAccount() {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return {error: true as const, message: await t('Unauthorized')};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {error: true as const, message: await t('Bad request')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true as const, message: await t('Bad request')};

  if (!getSignInMethods(tenant.config).password) {
    return {
      error: true as const,
      message: await t('Email and password sign-in is not available'),
    };
  }

  const partner = await findGooveeUserByEmail(user.email, tenant.client);

  if (!partner) {
    return {error: true as const, message: await t('Bad request')};
  }

  return {error: false as const, user, tenantId, tenant, partner};
}

export async function changePassword(data: ChangePassword) {
  const validation = ChangePasswordSchema.safeParse(data);

  if (!validation.success) {
    return {
      error: true,
      message: z.prettifyError(validation.error),
    };
  }

  const {oldPassword, newPassword} = validation.data;

  const account = await findPasswordAccount();
  if (account.error) return {error: true, message: account.message};

  const {user, tenant, partner} = account;
  const {client} = tenant;

  if (!partner.password) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const isOldPasswordMatch = await compare(oldPassword, partner.password);

  if (!isOldPasswordMatch) {
    return {
      error: true,
      message: await t('Invalid old password'),
    };
  }

  try {
    await withMattermostSync({
      config: tenant.config,
      email: user.email,
      password: newPassword,
      name: partner.name || 'user',
      firstName: partner.firstName || 'user',
      context: CHANGE_PASSWORD,
    });
  } catch (err) {
    return {
      message: await t('Error setting new password. Try again.'),
      success: false,
    };
  }

  const hashedNewPassword = await hash(newPassword);

  try {
    await client.aOSPartner.update({
      data: {
        id: partner.id,
        version: partner.version,
        password: hashedNewPassword,
      },
      select: {id: true},
    });
  } catch (err) {
    return {
      error: true,
      message: await t('Error setting new password. Try again.'),
    };
  }

  return {
    success: true,
    message: await t('Password changed successfully.'),
  };
}

/**
 * Sends a verification code to the signed-in user's email, for an account
 * created through Google or Keycloak that has no password yet.
 */
export async function sendSetPasswordCode() {
  const account = await findPasswordAccount();
  if (account.error) return {error: true, message: account.message};

  const {user, tenantId, tenant, partner} = account;

  if (partner.password) {
    return {
      error: true,
      message: await t('Your account already has a password.'),
    };
  }

  const result = await generateOTP({
    email: user.email,
    scope: Scope.SetPassword,
    tenantId,
    client: tenant.client,
  });

  if (result?.error) return {error: true, message: result.message};

  return {
    error: false,
    message: await t('A verification code has been sent to your email.'),
  };
}

/**
 * Sets the first password of an account that has none, once the code sent by
 * `sendSetPasswordCode` is entered.
 *
 * The code is what makes this safe: a signed-in session alone is not enough to
 * add a credential that outlives it, since whoever holds a stolen session would
 * then hold the account for good.
 */
export async function setPassword(data: SetPassword) {
  const validation = SetPasswordSchema.safeParse(data);

  if (!validation.success) {
    return {
      error: true,
      message: z.prettifyError(validation.error),
    };
  }

  const {otp, newPassword} = validation.data;

  const account = await findPasswordAccount();
  if (account.error) return {error: true, message: account.message};

  const {user, tenant, partner} = account;
  const {client} = tenant;

  if (partner.password) {
    return {
      error: true,
      message: await t('Your account already has a password.'),
    };
  }

  const otpResult = await findOne({
    scope: Scope.SetPassword,
    entity: user.email,
    client,
  });

  if (!(otpResult && (await isValid({id: otpResult.id, value: otp, client})))) {
    return {
      error: true,
      message: await t('Invalid OTP'),
    };
  }

  try {
    await withMattermostSync({
      config: tenant.config,
      email: user.email,
      password: newPassword,
      name: partner.name || 'user',
      firstName: partner.firstName || 'user',
      context: SET_PASSWORD,
    });
  } catch (err) {
    return {
      error: true,
      message: await t('Error setting new password. Try again.'),
    };
  }

  const hashedNewPassword = await hash(newPassword);

  try {
    await client.$transaction(async txClient => {
      await markUsed({id: otpResult.id, client: txClient});
      await txClient.aOSPartner.update({
        data: {
          id: partner.id,
          version: partner.version,
          password: hashedNewPassword,
        },
        select: {id: true},
      });
    });
  } catch (err) {
    return {
      error: true,
      message: await t('Error setting new password. Try again.'),
    };
  }

  return {
    success: true,
    message: await t('Password set successfully.'),
  };
}
