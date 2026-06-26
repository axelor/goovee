// ---- CORE IMPORTS ---- //
import {filterPrivate} from '@/orm/filter';
import type {Cloned} from '@/types/util';
import type {Client} from '@/goovee/.generated/client';
import type {User, Category} from '@/types';
import type {Workspace} from '@/orm/workspace';

type RawCategory = {
  id: string;
  name: string | null;
  slug: string | null;
  parentProductCategory: {id: string} | null;
};

function transform($categories: RawCategory[]): Category[] {
  const categoriesMap: Record<string, Category> = {};

  $categories.forEach(category => {
    categoriesMap[category.id] = {
      id: category.id,
      name: category.name ?? '',
      slug: category.slug ?? '',
      parent: category.parentProductCategory,
      items: [],
    };
  });

  Object.values(categoriesMap).forEach(category => {
    const {parent} = category;
    if (parent && categoriesMap[parent.id]) {
      categoriesMap[parent.id].items!.push(category);
    }
  });

  return Object.values(categoriesMap);
}

export async function findCategories({
  workspace,
  client,
  user,
  archived,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  archived?: boolean;
}) {
  if (!(workspace && client)) return [];

  const categories = await client.aOSProductCategory.find({
    where: {
      portalWorkspace: {
        id: workspace.id,
      },
      AND: [
        filterPrivate({user}),
        archived
          ? {archived: true}
          : {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      id: true,
      name: true,
      parentProductCategory: {id: true},
      slug: true,
    },
  });

  return transform(categories);
}

export async function findFeaturedCategories({
  workspace,
  client,
  user,
  archived,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  archived?: boolean;
}) {
  if (!(workspace && client)) return [];

  const categories = await client.aOSProductCategory.find({
    where: {
      portalWorkspace: {
        id: workspace.id,
      },
      isFeatured: true,
      AND: [
        filterPrivate({user}),
        archived
          ? {archived: true}
          : {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      name: true,
      parentProductCategory: {id: true},
      productList: {
        where: {
          homepage: true,
        },
        orderBy: {
          featured: 'DESC',
        },
        select: {
          id: true,
        },
      },
      slug: true,
    },
  });

  return categories;
}
