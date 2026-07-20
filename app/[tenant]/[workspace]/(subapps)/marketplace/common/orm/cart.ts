import type {Client} from '@/goovee/.generated/client';
import {ID} from '@/types';
import type {Workspace} from '@/orm/workspace';
import {priceSelectFields, withPublishedProductFilter} from './helpers';

export type CartProduct = Awaited<ReturnType<typeof findCartProducts>>[number];

export async function findCartProducts({
  client,
  workspace,
  mainPartnerId,
  productIds,
}: {
  client: Client;
  workspace: Workspace;
  mainPartnerId: string;
  productIds: string[];
}) {
  const [products, ownedIds] = await Promise.all([
    client.aOSMarketplaceProduct.find({
      where: withPublishedProductFilter(workspace)({id: {in: productIds}}),
      select: {
        id: true,
        slug: true,
        name: true,
        currentVersion: {id: true, statusSelect: true},
        ...priceSelectFields,
      },
    }),
    findOwnedProductIds({
      productIds,
      client,
      mainPartnerId,
    }),
  ]);
  return products.map(p => ({
    ...p,
    isOwned: ownedIds.has(p.id),
  }));
}

export type CartProductAvailability = Awaited<
  ReturnType<typeof findCartProductsAvailability>
>[number];

export async function findCartProductsAvailability({
  client,
  workspace,
  mainPartnerId,
  productIds,
}: {
  client: Client;
  workspace: Workspace;
  mainPartnerId: string;
  productIds: string[];
}) {
  const [products, ownedIds] = await Promise.all([
    client.aOSMarketplaceProduct.find({
      where: withPublishedProductFilter(workspace)({id: {in: productIds}}),
      select: {
        id: true,
        slug: true,
        name: true,
        currentVersion: {id: true, statusSelect: true},
      },
    }),
    findOwnedProductIds({
      productIds,
      client,
      mainPartnerId,
    }),
  ]);
  return products.map(p => ({
    ...p,
    isOwned: ownedIds.has(p.id),
  }));
}

async function findOwnedProductIds({
  productIds,
  client,
  mainPartnerId,
}: {
  productIds: ID[];
  client: Client;
  mainPartnerId: ID;
}): Promise<Set<string>> {
  const owned = await client.aOSMarketplaceProductPurchase.find({
    where: {
      owner: {id: mainPartnerId},
      marketplaceProduct: {id: {in: productIds}},
    },
    select: {marketplaceProduct: {id: true}},
  });
  const ownedIds = new Set(owned.map(o => o.marketplaceProduct.id));
  return ownedIds;
}
