import type {Client} from '@/goovee/.generated/client';
import type {AOSProductCategory} from '@/goovee/.generated/models';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import type {QueryProps} from './helpers';
import {withCategoryAccessFilter} from './helpers';

export type ListCategory = Awaited<
  ReturnType<typeof findProductCategories>
>[number];

export async function findProductCategories({
  client,
  workspace,
  where,
  take,
  skip,
  orderBy,
}: {
  client: Client;
  workspace: PortalWorkspaceWithConfig;
} & QueryProps<AOSProductCategory>) {
  const categories = await client.aOSProductCategory.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: withCategoryAccessFilter(workspace)({
      ...where,
    }),
    select: {
      id: true,
      name: true,
      colorTheme: true,
      iconCode: true,
    },
  });

  return categories;
}
