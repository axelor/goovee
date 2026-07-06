// ---- CORE IMPORTS ---- //
import {ORDER_BY} from '@/constants';
import type {User} from '@/types';
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
      filterPrivate({user}),
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
