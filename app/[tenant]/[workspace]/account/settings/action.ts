'use server';

// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import {accessMessage} from '@/lib/core/access/denial';
import {ensureWorkspaceAccess} from '@/lib/core/access/ensure-workspace-access';
import {findGooveeUserByEmail, updatePartner} from '@/orm/partner';
import {clone} from '@/utils';
import {SUBAPP_PAGE} from '@/constants';

export async function removeWorkpace() {
  const access = await ensureWorkspaceAccess();

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user, tenant, url} = access;
  const {client} = tenant;
  const workspaceURL = url.key();

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
    url.revalidate(`/${SUBAPP_PAGE.account}`);
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
