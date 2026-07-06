'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {clone} from '@/utils';
import {TENANT_HEADER} from '@/proxy';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {filterPrivate} from '@/orm/filter';

// ---- LOCAL IMPORTS ---- //
import {FindDmsFilesSchema} from '@/subapps/resources/common/utils/validators';

export async function findDmsFiles({
  search = '',
  workspaceURL,
}: {
  search: string;
  workspaceURL: string;
}) {
  const parsed = FindDmsFilesSchema.safeParse({search, workspaceURL});
  if (!parsed.success) return [];

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) return [];

  const access = await ensureAccess({
    code: SUBAPP_CODES.resources,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) return [];

  const {user} = access;
  const {client} = access.tenant;

  return client.aOSDMSFile
    .find({
      where: {
        ...(search
          ? {
              fileName: {
                like: `%${search}%`,
              },
            }
          : {}),
        workspaceSet: {
          url: workspaceURL,
        },
        ...filterPrivate({
          user,
        }),
      },
      select: {
        fileName: true,
        createdBy: {name: true, fullName: true},
        createdOn: true,
        metaFile: {
          description: true,
          sizeText: true,
          createdOn: true,
          updatedOn: true,
          fileName: true,
          filePath: true,
          fileSize: true,
          fileType: true,
        },
        parent: {id: true},
        isDirectory: true,
      },
    })
    .then(clone);
}
