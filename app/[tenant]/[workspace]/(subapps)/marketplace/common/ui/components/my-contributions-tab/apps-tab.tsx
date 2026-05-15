import {findMyProducts} from '../../../orm/orm';
import {MARKETPLACE_TYPE} from '../../../constant/marketplace-types';
import {ProductsListTab} from './products-list-tab';
import {getSkip} from '../../../../../ticketing/common/utils/search-param';
import type {Client} from '@/goovee/.generated/client';
import type {ID} from '@/types';
import type {PortalWorkspaceWithConfig} from '../../../utils/auth-helper';

type AppsTabProps = {
  userId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  workspaceURI: string;
  page: number;
};

const PAGE_SIZE = 10;

export async function AppsTab({
  userId,
  client,
  workspace,
  workspaceURI,
  page,
}: AppsTabProps) {
  const apps = await findMyProducts({
    userId,
    client,
    workspace,
    type: MARKETPLACE_TYPE.APP,
    take: PAGE_SIZE,
    skip: getSkip(PAGE_SIZE, page),
  });

  const totalCount = Number(apps?.[0]?._count ?? 0);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <ProductsListTab
      products={apps}
      title="Apps"
      workspaceURI={workspaceURI}
      page={page}
      totalPages={totalPages}
      paramName="appsPage"
    />
  );
}
