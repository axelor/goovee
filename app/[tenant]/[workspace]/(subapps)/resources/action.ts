'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {manager} from '@/tenant';
import {clone} from '@/utils';
import type {PortalWorkspace} from '@/types';
import {TENANT_HEADER} from '@/middleware';
import {getSession} from '@/auth';
import {filterPrivate} from '@/orm/filter';

export async function findDmsFiles({
  search = '',
  workspace,
}: {
  search: string;
  workspace: PortalWorkspace;
}) {
  if (!workspace) return [];

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) return [];

  const client = await manager.getClient(tenantId);

  const session = await getSession();
  const user = session?.user;

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
          id: workspace.id,
        },
        ...(await filterPrivate({
          user,
          tenantId,
        })),
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
