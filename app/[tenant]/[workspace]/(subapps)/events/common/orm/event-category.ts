// ---- CORE IMPORTS ---- //
import {manager} from '@/tenant';
import {ORDER_BY} from '@/constants';
import type {PortalWorkspace, User} from '@/types';
import type {Tenant} from '@/tenant';
import {filterPrivate} from '@/orm/filter';
import {and} from '@/utils/orm';
import type {AOSPortalEventCategory} from '@/goovee/.generated/models';

export async function findEventCategories({
  workspace,
  tenantId,
  user,
  categoryId,
}: {
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  user?: User;
  categoryId?: string;
}) {
  if (!(workspace && tenantId)) return [];

  const c = await manager.getClient(tenantId);

  const eventCategories = await c.aOSPortalEventCategory.find({
    where: and<AOSPortalEventCategory>([
      categoryId && {id: categoryId},
      {
        workspace: {id: workspace.id},
        OR: [{archived: false}, {archived: null}],
      },
      await filterPrivate({user, tenantId}),
    ]),
    orderBy: {name: ORDER_BY.ASC} as any,
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
  tenantId,
  workspace,
  user,
}: {
  id: string;
  tenantId: Tenant['id'];
  workspace: PortalWorkspace;
  user?: User;
}) {
  if (!(workspace && tenantId)) return null;

  const categories = await findEventCategories({
    categoryId: id,
    workspace,
    tenantId,
    user,
  });

  return categories?.[0] || null;
}
