import {countMyProducts} from '../../../orm/orm';
import {MARKETPLACE_TYPE} from '../../../constant/marketplace-types';
import type {Client} from '@/goovee/.generated/client';
import type {ID} from '@/types';
import type {PortalWorkspaceWithConfig} from '../../../utils/auth-helper';

async function SkillsCountBadge({
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
    type: MARKETPLACE_TYPE.SKILL,
  });

  return <>{count}</>;
}

export {SkillsCountBadge};
