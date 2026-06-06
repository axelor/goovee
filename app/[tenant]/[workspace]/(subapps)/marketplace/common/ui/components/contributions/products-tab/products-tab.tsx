import type {Client} from '@/goovee/.generated/client';
import {t} from '@/locale/server';
import type {ID} from '@/types';
import {getSkip, getTotal} from '@/utils/pagination';
import {
  findMyProducts,
  type CompatibilityVersion,
  type ListCategory,
  type ListLicense,
} from '../../../../orm';
import type {Currency} from '@/product/orm';
import type {PortalWorkspaceWithConfig} from '../../../../utils/auth-helper';
import {ProductsListTab} from '../products-list-tab';

type ProductsTabProps = {
  mainPartnerId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  newListingCurrency: Currency | null;
  workspaceURI: string;
  workspaceURL: string;
  categories: ListCategory[];
  licenses: ListLicense[];
  compatibilityVersions: CompatibilityVersion[];
  page: number;
};

const PAGE_SIZE = 10;

export async function ProductsTab({
  mainPartnerId,
  client,
  workspace,
  newListingCurrency,
  workspaceURI,
  workspaceURL,
  categories,
  licenses,
  compatibilityVersions,
  page,
}: ProductsTabProps) {
  const products = await findMyProducts({
    mainPartnerId,
    client,
    workspace,
    take: PAGE_SIZE,
    skip: getSkip(PAGE_SIZE, page),
    orderBy: {createdOn: 'DESC'},
  });

  const totalCount = getTotal(products);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <ProductsListTab
      products={products}
      title={await t('Products')}
      requiresReview={workspace.config.requiresReview === true}
      allowToPublish={workspace.config.allowToPublish === true}
      newListingCurrency={newListingCurrency}
      inAti={workspace.config.defaultProductForMarketplace?.inAti === true}
      workspaceURI={workspaceURI}
      workspaceURL={workspaceURL}
      categories={categories}
      licenses={licenses}
      compatibilityVersions={compatibilityVersions}
      page={page}
      totalPages={totalPages}
      paramName="productsPage"
    />
  );
}
