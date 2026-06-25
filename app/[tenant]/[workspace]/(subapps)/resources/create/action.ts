'use server';

import path from 'path';
import {headers} from 'next/headers';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import {SUBAPP_CODES} from '@/constants';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessMessage} from '@/lib/core/access/denial';
import {TENANT_HEADER} from '@/proxy';
import type {Client} from '@/goovee/.generated/client';
import {redeemUpload} from '@/lib/core/upload/staged-upload';
import type {ID} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {fetchFile} from '@/subapps/resources/common/orm/dms';
import {
  ACTION,
  RESOURCE_DMS_UPLOAD_PURPOSE,
} from '@/subapps/resources/common/constants';
import {UploadSchema, type UploadInput} from '../common/utils/validators';

/**
 * Redeem each pre-staged upload claim into its `meta_file` id, then rename the
 * stored file to the user-supplied title (keeping the staged file's extension)
 * and apply the description. Runs in the caller's transaction so a later failure
 * rolls the consume back and the tokens stay redeemable.
 */
async function redeemDmsFiles({
  values,
  owner,
  client,
}: {
  values: UploadInput['values'];
  owner: ID;
  client: Client;
}): Promise<{metaFileId: ID; fileName: string; description: string}[]> {
  const redeemed: {metaFileId: ID; fileName: string; description: string}[] =
    [];

  for (const {token, title, description} of values) {
    const metaFileId = await redeemUpload({
      token,
      purpose: RESOURCE_DMS_UPLOAD_PURPOSE,
      owner,
      client,
    });

    const metaFile = await client.aOSMetaFile.findOne({
      where: {id: metaFileId},
      select: {fileName: true, id: true, version: true},
    });
    if (!metaFile) {
      throw new Error('Upload not redeemable');
    }

    const fileName = `${title}${path.extname(metaFile.fileName ?? '')}`;
    await client.aOSMetaFile.update({
      data: {
        id: metaFileId,
        version: metaFile.version,
        fileName,
        ...(description && {description}),
      },
    });

    redeemed.push({metaFileId, fileName, description});
  }

  return redeemed;
}

export async function upload(input: UploadInput) {
  const parsed = UploadSchema.safeParse(input);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {workspaceURL, parent: parentId, values} = parsed.data;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid Tenant'),
    };
  }

  const access = await ensureAuth({
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
    partnerSet,
    partnerCategorySet,
    isDirectory,
    isPrivate,
  } = parent;

  const canModify =
    permissionSelect === ACTION.WRITE || permissionSelect === ACTION.UPLOAD;

  if (!(isDirectory && canModify)) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  try {
    // redeem + create atomically: a failed create rolls the token consume back
    await client.$transaction(async (txClient: Client) => {
      const files = await redeemDmsFiles({
        values,
        owner: user.id,
        client: txClient,
      });

      const timestamp = new Date();
      await txClient.aOSDMSFile.createAll({
        data: files.map(({metaFileId, fileName}) => ({
          fileName,
          isDirectory: false,
          parent: {select: {id: Number(parent.id)}},
          createdOn: timestamp,
          updatedOn: timestamp,
          workspaceSet: {
            select: [{url: workspaceURL}],
          },
          isPrivate,
          permissionSelect,
          ...(partnerSet?.length
            ? {partnerSet: {select: partnerSet.map(({id}) => ({id}))}}
            : {}),
          ...(partnerCategorySet?.length
            ? {
                partnerCategorySet: {
                  select: partnerCategorySet.map(({id}) => ({id})),
                },
              }
            : {}),
          metaFile: {select: {id: metaFileId}},
        })),
        select: {id: true},
      });
    });

    revalidatePath(`${workspaceURL}/${SUBAPP_CODES.resources}/categories`);
  } catch (err) {
    return {
      error: true,
    };
  }

  return {
    success: true,
  };
}
