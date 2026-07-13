'use server';

import {revalidatePath} from 'next/cache';
import {headers} from 'next/headers';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {accessMessage} from '@/lib/core/access/denial';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {fetchFile} from '@/subapps/resources/common/orm/dms';
import {ACTION} from '../../common/constants';
import {CreateCategorySchema} from '../../common/utils/validators';

export async function create(formData: FormData, workspaceURL: string) {
  const parsed = CreateCategorySchema.safeParse({
    workspaceURL,
    title: formData.get('title'),
    description: formData.get('description') ?? undefined,
    icon: formData.get('icon') ?? undefined,
    parent: formData.get('parent'),
    color: formData.get('color') ?? undefined,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {title, description, icon, parent: parentId, color} = parsed.data;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid Tenant'),
    };
  }

  const access = await ensureAccess({
    code: SUBAPP_CODES.resources,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user} = access;
  const {client} = access.tenant;

  const parent = await fetchFile({
    id: parentId,
    workspaceURL,
    user,
    client,
  });

  if (!parent) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const {
    permissionSelect,
    isPrivate,
    partnerSet,
    partnerCategorySet,
    isDirectory,
  } = parent;

  const canModify = permissionSelect === ACTION.WRITE || false;

  if (!(isDirectory && canModify)) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  try {
    const category = await client.aOSDMSFile
      .create({
        data: {
          fileName: title,
          isDirectory: true,
          workspaceSet: {
            select: [{url: workspaceURL}],
          },
          isPrivate,
          permissionSelect,
          description,
          colorSelect: color,
          logoSelect: icon,
          ...(partnerSet?.length
            ? {
                partnerSet: {
                  select: partnerSet.map(({id}) => ({id})),
                },
              }
            : {}),
          ...(partnerCategorySet?.length
            ? {
                partnerCategorySet: {
                  select: partnerCategorySet.map(({id}) => ({id})),
                },
              }
            : {}),
          ...(parent
            ? {
                parent: {
                  select: {
                    id: Number(parent?.id),
                  },
                },
              }
            : {}),
        },
        select: {id: true},
      })
      .then(clone);

    revalidatePath(`${workspaceURL}/${SUBAPP_CODES.resources}`);

    return {
      success: true,
      data: category,
    };
  } catch (err) {
    return {
      error: true,
      message: await t('Error creating category'),
    };
  }
}
