import {
  findMyProducts,
  type CompatibilityVersion,
  type ListCategory,
} from '../../../orm/orm';
import {MARKETPLACE_TYPE} from '../../../constants/marketplace-types';
import {ProductsListTab} from './products-list-tab';
import {getSkip, getTotal} from '@/utils/pagination';
import {t} from '@/locale/server';
import type {Client} from '@/goovee/.generated/client';
import type {ID} from '@/types';
import type {PortalWorkspaceWithConfig} from '../../../utils/auth-helper';

type AppsTabProps = {
  partnerId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  workspaceURI: string;
  workspaceURL: string;
  categories: ListCategory[];
  compatibilityVersions: CompatibilityVersion[];
  page: number;
};

const PAGE_SIZE = 10;

export async function AppsTab({
  partnerId,
  client,
  workspace,
  workspaceURI,
  workspaceURL,
  categories,
  compatibilityVersions,
  page,
}: AppsTabProps) {
  const apps = await findMyProducts({
    partnerId,
    client,
    workspace,
    type: MARKETPLACE_TYPE.APP,
    take: PAGE_SIZE,
    skip: getSkip(PAGE_SIZE, page),
    orderBy: {createdOn: 'DESC'},
  });

  const totalCount = getTotal(apps);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <ProductsListTab
      products={apps}
      title={await t('Apps')}
      requiresReview={workspace.config.requiresReview === true}
      allowToPublish={workspace.config.allowToPublish === true}
      currencySymbol={workspace.config.marketplaceDefaultSaleCurrency?.symbol}
      inAti={workspace.config.marketplaceInAti === true}
      workspaceURI={workspaceURI}
      workspaceURL={workspaceURL}
      categories={categories}
      compatibilityVersions={compatibilityVersions}
      page={page}
      totalPages={totalPages}
      paramName="appsPage"
    />
  );
}
