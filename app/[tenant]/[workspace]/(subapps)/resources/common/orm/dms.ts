// ---- CORE IMPORTS ---- //
import {manager, type Tenant} from '@/tenant';
import {clone} from '@/utils';
import type {PortalWorkspace, User} from '@/types';
import {filterPrivate} from '@/orm/filter';

// ---- LOCAL IMPORTS ---- //
import {COLORS, ICONS} from '@/subapps/resources/common/constants';

export async function fetchFolders({
  workspace,
  tenantId,
  params,
  user,
  archived,
}: {
  params?: any;
  tenantId: Tenant['id'];
  workspace: PortalWorkspace;
  user?: User;
  archived?: boolean;
}) {
  if (!(workspace && tenantId)) return [];

  const client = await manager.getClient(tenantId);

  const folders = await client.aOSDMSFile.find({
    where: {
      isDirectory: true,
      workspaceSet: {
        id: workspace?.id,
      },
      ...(params?.where || {}),
      AND: [
        await filterPrivate({tenantId, user}),
        archived
          ? {archived: true}
          : {OR: [{archived: false}, {archived: null}]},
        ...(params?.where?.AND || []),
      ],
    },
    select: {
      fileName: true,
      parent: {id: true},
      contentType: true,
      description: true,
      colorSelect: true,
      logoSelect: true,
    },
    orderBy: {
      updatedOn: 'DESC',
    } as any,
    take: params?.take,
  });

  return folders;
}

export async function fetchLatestFolders({
  workspace,
  tenantId,
  user,
}: {
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  user?: User;
}) {
  return fetchFolders({
    workspace,
    tenantId,
    user,
    params: {
      where: {isHomepage: true},
      take: 10,
    },
  });
}

export async function fetchFiles({
  id,
  workspace,
  user,
  tenantId,
  archived,
}: {
  id: string;
  workspace: PortalWorkspace;
  user?: User;
  tenantId: Tenant['id'];
  archived?: boolean;
}) {
  if (!(workspace && tenantId)) {
    return [];
  }

  const client = await manager.getClient(tenantId);

  const files = await client.aOSDMSFile.find({
    where: {
      isDirectory: {
        ne: true,
      },
      parent: {
        id,
      },
      AND: [
        await filterPrivate({tenantId, user}),
        archived
          ? {archived: true}
          : {OR: [{archived: false}, {archived: null}]},
      ],
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
    },
  });

  return files;
}

export async function fetchLatestFiles({
  workspace,
  tenantId,
  user,
  archived,
}: {
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  user?: User;
  archived?: boolean;
}) {
  if (!(workspace && tenantId)) return [];

  const client = await manager.getClient(tenantId);

  const files = await client.aOSDMSFile.find({
    where: {
      isDirectory: {
        ne: true,
      },
      workspaceSet: {
        id: workspace?.id,
      },
      AND: [
        await filterPrivate({tenantId, user}),
        archived
          ? {archived: true}
          : {OR: [{archived: false}, {archived: null}]},
      ],
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
    },
    orderBy: {
      updatedOn: 'DESC',
    } as any,
    take: 10,
  });

  return files;
}

export async function fetchFile({
  id,
  workspace,
  user,
  tenantId,
  archived,
}: {
  id: string;
  workspace: PortalWorkspace;
  user?: User;
  tenantId: Tenant['id'];
  archived?: boolean;
}) {
  const client = await manager.getClient(tenantId);

  const file = await client.aOSDMSFile.findOne({
    where: {
      id,
      workspaceSet: {
        id: workspace?.id,
      },
      AND: [
        await filterPrivate({tenantId, user}),
        archived
          ? {archived: true}
          : {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      fileName: true,
      contentType: true,
      content: true,
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
      permissionSelect: true,
      isPrivate: true,
      partnerSet: {select: {id: true}},
      partnerCategorySet: {select: {id: true}},
      isDirectory: true,
      description: true,
    },
  });

  return file;
}

export async function fetchColors() {
  return COLORS;
}

export async function fetchIcons() {
  return ICONS;
}

export async function fetchExplorerCategories({
  workspace,
  user,
  tenantId,
  archived,
}: {
  workspace: PortalWorkspace;
  user?: User;
  tenantId: Tenant['id'];
  archived?: boolean;
}) {
  if (!(workspace && tenantId)) return [];

  const client = await manager.getClient(tenantId);

  const categories = await client.aOSDMSFile
    .find({
      where: {
        isDirectory: true,
        workspaceSet: {
          id: workspace.id,
        },
        AND: [
          await filterPrivate({tenantId, user}),
          archived
            ? {archived: true}
            : {OR: [{archived: false}, {archived: null}]},
        ],
      },
      select: {
        parent: {
          id: true,
        },
        fileName: true,
        logoSelect: true,
        colorSelect: true,
      },
    })
    .then(clone);

  const hiearchy = (categories: any) => {
    const map: any = {};
    categories.forEach((category: any) => {
      category.children = [];
      map[category.id] = category;
    });

    categories.forEach((category: any) => {
      const {parent} = category;
      if (parent?.id) {
        map[parent.id]?.children.push(category);
      }
    });

    const _parent = (category: any, parents: any[] = []) => {
      if (!category._parent) {
        category._parent = [...parents];
      }

      category.children.forEach((child: any) => {
        _parent(child, [...parents, category.id]);
      });
    };

    Object.values(map).map(category => _parent(category));

    return Object.values(map);
  };

  return hiearchy(categories);
}
