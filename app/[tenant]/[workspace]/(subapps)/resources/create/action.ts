'use server';

import fs from 'fs';
import path from 'path';
import {pipeline} from 'stream';
import {promisify} from 'util';
import {headers} from 'next/headers';
import {revalidatePath} from 'next/cache';

// ---- CORE IMPORTS ---- //
import {manager} from '@/tenant';
import {t} from '@/locale/server';
import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {findWorkspace, findSubappAccess} from '@/orm/workspace';
import {getCurrentDateTime} from '@/utils/date';
import {TENANT_HEADER} from '@/middleware';
import {getFileSizeText} from '@/utils/files';
import {getStoragePath} from '@/storage/index';

// ---- LOCAL IMPORTS ---- //
import {fetchFile} from '@/subapps/resources/common/orm/dms';
import {ACTION} from '@/subapps/resources/common/constants';

const pump = promisify(pipeline);

function extractFileValues(formData: FormData) {
  let values: any = [];

  for (let pair of formData.entries()) {
    let key = pair[0];
    let value = pair[1];

    let index: any = Number(key.match(/\[(\d+)\]/)?.[1]);

    if (Number.isNaN(index)) {
      continue;
    }

    if (!values[index]) {
      values[index] = {};
    }

    let field = key.substring(key.lastIndexOf('[') + 1, key.lastIndexOf(']'));

    if (field === 'title' || field === 'description') {
      values[index][field] = value;
    } else if (field === 'file') {
      values[index][field] =
        value instanceof File ? value : new File([value], 'filename');
    }
  }

  return values;
}

export async function upload(formData: FormData, workspaceURL: string) {
  if (!workspaceURL) {
    return {
      error: true,
      message: await t('Workspace not provided.'),
    };
  }

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Invalid Tenant'),
    };
  }

  const client = await manager.getClient(tenantId);

  const parentId = formData.get('parent');

  if (!parentId) {
    return {
      error: true,
      message: await t('Parent is required'),
    };
  }

  const session = await getSession();

  const user = session?.user;

  if (!user) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.resources,
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!subapp) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const parent = await fetchFile({
    id: parentId as string,
    workspace,
    user,
    tenantId,
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
    permissionSelect &&
    [ACTION.WRITE, ACTION.UPLOAD].includes(permissionSelect);

  if (!(isDirectory && canModify)) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const values = extractFileValues(formData);

  const getTimestampFilename = (name: any) => {
    return `${new Date().getTime()}-${name}`;
  };

  const create = async ({file, title, description}: any) => {
    try {
      const name = title || file.name;

      const timestampFilename = getTimestampFilename(name);

      await pump(
        file.stream(),
        fs.createWriteStream(path.resolve(getStoragePath(), timestampFilename)),
      );

      const timestamp = getCurrentDateTime();

      await client.aOSDMSFile.create({
        data: {
          fileName: name,
          isDirectory: false,
          parent: {select: {id: Number(parent.id)}},
          createdOn: timestamp as unknown as Date,
          updatedOn: timestamp as unknown as Date,
          workspaceSet: {
            select: [{id: workspace.id}],
          },
          isPrivate,
          permissionSelect,
          ...(partnerSet?.length
            ? {
                partnerSet: {
                  select: partnerSet.map(({id}: any) => ({id})),
                },
              }
            : {}),
          ...(partnerCategorySet?.length
            ? {
                partnerCategorySet: {
                  select: partnerCategorySet.map(({id}: any) => ({id})),
                },
              }
            : {}),
          metaFile: {
            create: {
              fileName: name,
              filePath: timestampFilename,
              fileType: file.type,
              fileSize: file.size,
              sizeText: getFileSizeText(file.size),
              description: description,
              createdOn: timestamp,
              updatedOn: timestamp,
            },
          },
        },
        select: {
          metaFile: true,
          parent: true,
        },
      });
    } catch (err) {}
  };

  try {
    await Promise.all(
      values.map(({title, description, file}: any) =>
        create({
          title: `${title}${path.extname(file.name)}`,
          description,
          file,
        }),
      ),
    );

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
