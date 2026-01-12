'use server';

import {headers} from 'next/headers';
import {revalidatePath} from 'next/cache';

// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import {getSession} from '@/auth';
import {TENANT_HEADER} from '@/proxy';
import {findWorkspace} from '@/orm/workspace';
import {findGooveeUserByEmail, updatePartner} from '@/orm/partner';
import {clone} from '@/utils';
import {SUBAPP_PAGE} from '@/constants';
import {manager, type Tenant} from '@/tenant';

export async function removeWorkpace({workspaceURL}: {workspaceURL: string}) {
  if (!workspaceURL) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return {
      error: true,
      message: await t('Unauthorised user.'),
    };
  }

  const workspace = await findWorkspace({url: workspaceURL, user, tenantId});
  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const $user: any = await findGooveeUserByEmail(user.email, tenantId);

  if (!$user) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }
  const isContact = user?.isContact;

  const client = await manager.getClient(tenantId);

  if (!client) {
    return {error: true, message: await t('Invalid tenant')};
  }

  try {
    let result;
    if (isContact) {
      const contactConfig: any = await client.aOSPartner
        .findOne({
          where: {
            id: $user.id,
            isContact: true,
          },
          select: {
            contactWorkspaceConfigSet: {
              where: {
                portalWorkspace: {
                  url: workspaceURL,
                },
              },
              select: {id: true},
            },
          },
        })
        .then(contact => contact?.contactWorkspaceConfigSet?.[0]);

      if (!contactConfig) {
        return {error: true, message: await t('Bad request')};
      }

      result = await updatePartner({
        data: {
          id: $user.id as any,
          version: $user.version,
          contactWorkspaceConfigSet: {
            remove: [contactConfig?.id],
          } as any,
        },
        tenantId,
      });
    } else {
      const partnerWorkspace: any = await client.aOSPartner
        .findOne({
          where: {
            id: $user.id,
          },
          select: {
            partnerWorkspaceSet: {
              where: {
                workspace: {
                  url: workspaceURL,
                },
              },
              select: {id: true},
            },
          },
        })
        .then(partner => partner?.partnerWorkspaceSet?.[0]);

      if (!partnerWorkspace) {
        return {error: true, message: await t('Bad request')};
      }

      result = await client.aOSPartner
        .update({
          data: {
            id: $user.id as any,
            version: $user.version,
            partnerWorkspaceSet: {
              remove: [partnerWorkspace?.id],
            },
          },
          select: {id: true},
        })
        .then(clone);
    }
    revalidatePath(`${workspace.url}/${SUBAPP_PAGE.account}`);
    return {
      success: true,
    };
  } catch (err) {
    return {
      error: true,
      message: await t('Some error occured while leaving the workspace.'),
    };
  }
}
