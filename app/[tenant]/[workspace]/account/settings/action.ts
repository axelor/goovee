'use server';

import {headers} from 'next/headers';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import {getSession} from '@/auth';
import {TENANT_HEADER} from '@/proxy';
import {tenantURLs} from '@/lib/core/url/scope';
import {findWorkspace} from '@/orm/workspace';
import {findGooveeUserByEmail, updatePartner} from '@/orm/partner';
import {clone} from '@/utils';
import {SUBAPP_PAGE} from '@/constants';
import {manager, type Tenant} from '@/tenant';
import {
  RemoveWorkspaceSchema,
  type RemoveWorkspace,
} from '../common/utils/validators';

export async function removeWorkpace(data: RemoveWorkspace) {
  const validation = RemoveWorkspaceSchema.safeParse(data);

  if (!validation.success) {
    return {
      error: true,
      message: z.prettifyError(validation.error),
    };
  }

  const {workspaceURL} = validation.data;

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

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const workspace = await findWorkspace({url: workspaceURL, user, client});
  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const $user: any = await findGooveeUserByEmail(user.email, client);

  if (!$user) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }
  const isContact = user?.isContact;

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
        client,
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
    tenantURLs(tenantId)
      .workspaceByKey(workspaceURL)
      .revalidate(`/${SUBAPP_PAGE.account}`);
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
