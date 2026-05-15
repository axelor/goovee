import {countMyProducts} from '../../../orm/orm';
import {MARKETPLACE_TYPE} from '../../../constant/marketplace-types';
import type {Client} from '@/goovee/.generated/client';
import type {ID} from '@/types';
import type {PortalWorkspaceWithConfig} from '../../../utils/auth-helper';

async function AppsCountBadge({
  userId,
  client,
  workspace,
}: {
  userId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
}) {
  const count = await countMyProducts({
    userId,
    client,
    workspace,
    type: MARKETPLACE_TYPE.APP,
  });

  return <>{count}</>;
}

export {AppsCountBadge};
