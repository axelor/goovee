'use server';

import {z} from 'zod';
import {revalidateEverything} from '@/lib/core/url/revalidate';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {getTranslation} from '@/locale/server';
import {
  findDefaultPartnerWorkspaceConfig,
  findWorkspaces,
} from '@/orm/workspace';
import {manager} from '@/tenant';
import {
  SubscribeSchema,
  type Subscribe,
} from '@/lib/core/auth/validation-utils';
import type {ActionResponse, ErrorResponse} from '@/types/action';

function error(message: string): ErrorResponse {
  return {
    error: true,
    message,
  };
}

export async function subscribe(data: Subscribe): ActionResponse<true> {
  const validation = SubscribeSchema.safeParse(data);

  if (!validation.success) {
    return error(z.prettifyError(validation.error));
  }

  const {workspace} = validation.data;

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return error(await getTranslation({}, 'Unauthorized'));
  }

  /* Partner ids are per-tenant: `user.id` names this caller in the tenant that
   * issued their session, and the same number belongs to somebody else in every
   * other one. */
  const tenantId = user.tenantId;
  if (!tenantId) {
    return error(await getTranslation({}, 'Unauthorized'));
  }

  const url = workspace?.url;
  if (!url)
    return error(await getTranslation({tenant: tenantId}, 'Bad request'));

  const tenant = await manager.getTenant(tenantId);
  if (!tenant)
    return error(await getTranslation({tenant: tenantId}, 'Invalid tenant'));
  const {client} = tenant;

  const userWorkspaces = await findWorkspaces({url, user, client});

  const existing = userWorkspaces?.find(w => w.id === workspace?.id);

  if (existing) {
    return error(
      await getTranslation({tenant: tenantId}, 'Already subscribed'),
    );
  }

  const defaultPartnerWorkspaceConfig = await findDefaultPartnerWorkspaceConfig(
    {url, client},
  );

  if (!defaultPartnerWorkspaceConfig) {
    return error(
      await getTranslation(
        {tenant: tenantId},
        'Cannot subscribe, no default permissions available for the workspace',
      ),
    );
  }

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
    return error(await getTranslation({tenant: tenantId}, 'Bad request'));
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

      revalidateEverything();

      return {
        success: true,
        data: true,
        message: await getTranslation(
          {tenant: tenantId},
          'Successfully subscribed',
        ),
      };
    } catch (err) {}
  } else {
    const {mainPartner} = $user;

    if (!mainPartner?.id) {
      return error(
        await getTranslation(
          {tenant: tenantId},
          'Partner not available for the contact',
        ),
      );
    }
    const partnerWorkspaces = await findWorkspaces({
      url,
      user: {
        id: mainPartner.id!,
        isContact: false,
      } as any,
      client,
    });

    const existsInPartner = partnerWorkspaces.find((w: any) => w.url === url);

    if (!existsInPartner) {
      return error(
        await getTranslation(
          {tenant: tenantId},
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

        revalidateEverything();

        return {
          success: true,
          data: true,
          message: await getTranslation(
            {tenant: tenantId},
            'Successfully subscribed',
          ),
        };
      } catch (err) {
        console.log(err);
      }
    }
  }

  return error(
    await getTranslation({tenant: tenantId}, 'Error subscribing, try again'),
  );
}
