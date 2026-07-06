// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import type {User} from '@/types';
import {filterPrivate} from '@/orm/filter';
import type {Client} from '@/goovee/.generated/client';
import {ORDER_BY} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {COLORS, ICONS} from '@/subapps/resources/common/constants';

type FetchFoldersParams = {
  where?: {
    isHomepage?: boolean;
    AND?: object[];
  };
  take?: number;
};

export async function fetchFolders({
  workspaceURL,
  client,
  params,
  user,
  archived,
}: {
  params?: FetchFoldersParams;
  client: Client;
  workspaceURL: string;
  user?: User;
  archived?: boolean;
}) {
  if (!workspaceURL) return [];

  const folders = await client.aOSDMSFile.find({
    where: {
      isDirectory: true,
      workspaceSet: {
        url: workspaceURL,
      },
      ...(params?.where || {}),
      AND: [
        filterPrivate({user}),
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
      updatedOn: ORDER_BY.DESC,
    },
    take: params?.take,
  });

  return folders;
}

export async function fetchLatestFolders({
  workspaceURL,
  client,
  user,
}: {
  workspaceURL: string;
  client: Client;
  user?: User;
}) {
  return fetchFolders({
    workspaceURL,
    client,
    user,
    params: {
      where: {isHomepage: true},
      take: 10,
    },
  });
}

export async function fetchFiles({
  id,
  user,
  client,
  archived,
}: {
  id: string;
  user?: User;
  client: Client;
  archived?: boolean;
}) {
  const files = await client.aOSDMSFile.find({
    where: {
      isDirectory: {
        ne: true,
      },
      parent: {
        id,
      },
      AND: [
        filterPrivate({user}),
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
  workspaceURL,
  client,
  user,
  archived,
  take = 10,
}: {
  workspaceURL: string;
  client: Client;
  user?: User;
  archived?: boolean;
  take?: number;
}) {
  if (!workspaceURL) return [];

  const files = await client.aOSDMSFile.find({
    where: {
      isDirectory: {
        ne: true,
      },
      workspaceSet: {
        url: workspaceURL,
      },
      AND: [
        filterPrivate({user}),
        archived
          ? {archived: true}
          : {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      fileName: true,
      parent: {
        fileName: true,
      },
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
    },
    take,
  });

  return files;
}

export async function fetchFile({
  id,
  workspaceURL,
  user,
  client,
  archived,
}: {
  id: string;
  workspaceURL: string;
  user?: User;
  client: Client;
  archived?: boolean;
}) {
  const file = await client.aOSDMSFile.findOne({
    where: {
      id,
      workspaceSet: {
        url: workspaceURL,
      },
      AND: [
        filterPrivate({user}),
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
  workspaceURL,
  user,
  client,
  archived,
}: {
  workspaceURL: string;
  user?: User;
  client: Client;
  archived?: boolean;
}) {
  if (!workspaceURL) return [];

  const categories = await client.aOSDMSFile
    .find({
      where: {
        isDirectory: true,
        workspaceSet: {
          url: workspaceURL,
        },
        AND: [
          filterPrivate({user}),
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

  type CategoryFromDB = (typeof categories)[number];
  type CategoryNode = CategoryFromDB & {
    children: CategoryNode[];
    _parent: string[];
  };

  const hiearchy = (categories: CategoryFromDB[]): CategoryNode[] => {
    const map: Record<string, CategoryNode> = {};

    categories.forEach(category => {
      (category as CategoryNode).children = [];
      map[category.id] = category as CategoryNode;
    });

    categories.forEach(category => {
      const {parent} = category;
      if (parent?.id) {
        map[parent.id]?.children.push(category as CategoryNode);
      }
    });

    const _parent = (category: CategoryNode, parents: string[] = []) => {
      if (!category._parent) {
        category._parent = [...parents];
      }

      category.children.forEach(child => {
        _parent(child, [...parents, category.id]);
      });
    };

    Object.values(map).map(category => _parent(category));

    return Object.values(map);
  };

  return hiearchy(categories);
}
