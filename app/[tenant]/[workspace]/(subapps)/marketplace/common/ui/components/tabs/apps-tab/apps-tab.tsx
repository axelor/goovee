import type {Client} from '@/goovee/.generated/client';
import {t} from '@/locale/server';
import type {ID} from '@/types';
import {getSkip, getTotal} from '@/utils/pagination';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import {
  findMyProducts,
  type CompatibilityVersion,
  type ListCategory,
  type ListLicense,
} from '../../../../orm';
import type {PortalWorkspaceWithConfig} from '../../../../utils/auth-helper';
import {ProductsListTab} from '../products-list-tab';

type AppsTabProps = {
  mainPartnerId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  currencySymbol: string | null;
  workspaceURI: string;
  workspaceURL: string;
  categories: ListCategory[];
  licenses: ListLicense[];
  compatibilityVersions: CompatibilityVersion[];
  page: number;
};

const PAGE_SIZE = 10;

export async function AppsTab({
  mainPartnerId,
  client,
  workspace,
  currencySymbol,
  workspaceURI,
  workspaceURL,
  categories,
  licenses,
  compatibilityVersions,
  page,
}: AppsTabProps) {
  const apps = await findMyProducts({
    mainPartnerId,
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
      currencySymbol={currencySymbol}
      inAti={workspace.config.marketplaceInAti === true}
      workspaceURI={workspaceURI}
      workspaceURL={workspaceURL}
      categories={categories}
      licenses={licenses}
      compatibilityVersions={compatibilityVersions}
      page={page}
      totalPages={totalPages}
      paramName="appsPage"
    />
  );
}
