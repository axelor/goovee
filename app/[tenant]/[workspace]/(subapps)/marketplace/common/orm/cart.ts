import type {Client} from '@/goovee/.generated/client';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {priceSelectFields, withProductAccessFilter} from './helpers';

export type CartProduct = Awaited<ReturnType<typeof findCartProducts>>[number];

export async function findCartProducts({
  client,
  workspace,
  mainPartnerId,
  productIds,
}: {
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  mainPartnerId: string;
  productIds: string[];
}) {
  const products = await client.aOSMarketplaceProduct.find({
    where: withProductAccessFilter(workspace)({id: {in: productIds}}),
    select: {
      id: true,
      slug: true,
      name: true,
      ...priceSelectFields,
      currentVersion: {id: true, statusSelect: true},
    },
  });
  const owned = await client.aOSMarketplaceProductPurchase.find({
    where: {
      partner: {id: mainPartnerId},
      marketplaceProduct: {id: {in: productIds}},
    },
    select: {marketplaceProduct: {id: true}},
  });
  const ownedIds = new Set(
    owned.map(o => o.marketplaceProduct?.id).filter(Boolean) as string[],
  );
  return products.map(p => ({
    ...p,
    marketplaceProductPurchaseList: ownedIds.has(p.id) ? [{id: p.id}] : [],
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
  workspace: PortalWorkspaceWithConfig;
  mainPartnerId: string;
  productIds: string[];
}) {
  const products = await client.aOSMarketplaceProduct.find({
    where: withProductAccessFilter(workspace)({id: {in: productIds}}),
    select: {
      id: true,
      slug: true,
      name: true,
      currentVersion: {id: true},
    },
  });
  const owned = await client.aOSMarketplaceProductPurchase.find({
    where: {
      partner: {id: mainPartnerId},
      marketplaceProduct: {id: {in: productIds}},
    },
    select: {marketplaceProduct: {id: true}},
  });
  const ownedIds = new Set(
    owned.map(o => o.marketplaceProduct?.id).filter(Boolean) as string[],
  );
  return products.map(p => ({
    ...p,
    marketplaceProductPurchaseList: ownedIds.has(p.id) ? [{id: p.id}] : [],
  }));
}
