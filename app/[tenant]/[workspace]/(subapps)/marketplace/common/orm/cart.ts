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
  return client.aOSProduct.find({
    where: withProductAccessFilter(workspace)({id: {in: productIds}}),
    select: {
      id: true,
      slug: true,
      name: true,
      ...priceSelectFields,
      currentVersion: {id: true, statusSelect: true},
      marketplaceProductPurchaseList: {
        where: {partner: {id: mainPartnerId}},
        select: {id: true},
      },
    },
  });
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
  return client.aOSProduct.find({
    where: withProductAccessFilter(workspace)({id: {in: productIds}}),
    select: {
      id: true,
      slug: true,
      name: true,
      currentVersion: {id: true},
      marketplaceProductPurchaseList: {
        where: {partner: {id: mainPartnerId}},
        select: {id: true},
      },
    },
  });
}
