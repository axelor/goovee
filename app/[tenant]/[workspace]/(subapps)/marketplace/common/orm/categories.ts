import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceCategory} from '@/goovee/.generated/models';
import type {QueryProps} from './helpers';
import {withCategoryAccessFilter} from './helpers';

export type ListCategory = Awaited<
  ReturnType<typeof findProductCategories>
>[number];

export async function findProductCategories({
  client,
  where,
  take,
  skip,
  orderBy,
}: {
  client: Client;
} & QueryProps<AOSMarketplaceCategory>) {
  return client.aOSMarketplaceCategory.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: withCategoryAccessFilter()({...where}),
    select: {
      id: true,
      name: true,
    },
  });
}
