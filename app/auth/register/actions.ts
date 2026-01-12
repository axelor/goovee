'use server';

import {revalidatePath} from 'next/cache';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {register, RegisterDTO} from '@/lib/core/auth/orm';
import {getTranslation} from '@/locale/server';
import {
  findDefaultPartnerWorkspaceConfig,
  findWorkspaces,
} from '@/orm/workspace';
import {Scope} from '@/otp/constants';
import {findOne, isValid} from '@/otp/orm';
import {manager, type Tenant} from '@/tenant';
import type {PortalWorkspace} from '@/types';

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
        select: {id: true},
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
                    select: {
                      id: workspace.id,
                    },
                  },
                },
              ],
            },
          },
          select: {id: true},
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

  if (password.length < 8) {
    return error(
      await getTranslation(
        {tenant: tenantId},
        'Password must be at least 8 characters',
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
