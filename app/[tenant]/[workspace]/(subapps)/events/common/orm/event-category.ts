// ---- CORE IMPORTS ---- //
import {cache} from 'react';
import {ORDER_BY} from '@/constants';
import type {ID, User} from '@/types';
import {filterPrivate} from '@/orm/filter';
import {and} from '@/utils/orm';
import type {AOSPortalEventCategory} from '@/goovee/.generated/models';
import type {Client} from '@/goovee/.generated/client';

// ---- LOCAL IMPORTS ---- //
import type {Category} from '@/subapps/events/common/types';

export async function findEventCategories({
  workspaceURL,
  client,
  user,
  categoryId,
}: {
  workspaceURL: string;
  client: Client;
  user?: User;
  categoryId?: string;
}): Promise<Category[]> {
  if (!workspaceURL) return [];

  const eventCategories = await client.aOSPortalEventCategory.find({
    where: and<AOSPortalEventCategory>([
      categoryId && {id: categoryId},
      {
        workspace: {url: workspaceURL},
        OR: [{archived: false}, {archived: null}],
      },
      await filterPrivate({user, client}),
    ]),
    orderBy: {name: ORDER_BY.ASC},
    select: {
      id: true,
      name: true,
      color: true,
      description: true,
      image: {id: true},
      thumbnailImage: {id: true},
    },
  });

  return eventCategories;
}

export const getEventCategories = cache(
  (workspaceURL: string, user: User | undefined, client: Client) =>
    findEventCategories({workspaceURL, user, client}),
);

export async function findAccessibleEventCategoryIds({
  workspaceURL,
  categoryids,
  privateFilter,
  client,
}: {
  workspaceURL: string;
  categoryids?: ID[];
  privateFilter: Awaited<ReturnType<typeof filterPrivate>>;
  client: Client;
}): Promise<ID[]> {
  if (!workspaceURL) return [];

  const categories = await client.aOSPortalEventCategory.find({
    where: and<AOSPortalEventCategory>([
      {workspace: {url: workspaceURL}},
      categoryids?.length && {id: {in: categoryids}},
      privateFilter,
    ]),
    select: {id: true},
  });

  return categories.map(c => c.id);
}

export async function findEventCategory({
  id,
  client,
  workspaceURL,
  user,
}: {
  id: string;
  client: Client;
  workspaceURL: string;
  user?: User;
}): Promise<Category | null> {
  if (!workspaceURL) return null;

  const categories = await findEventCategories({
    categoryId: id,
    workspaceURL,
    client,
    user,
  });

  return categories?.[0] || null;
}
