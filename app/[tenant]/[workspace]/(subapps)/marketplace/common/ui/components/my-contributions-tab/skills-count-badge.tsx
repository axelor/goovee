import {countMyProducts} from '../../../orm/orm';
import {MARKETPLACE_TYPE} from '../../../constants/marketplace-types';
import type {Client} from '@/goovee/.generated/client';
import type {ID} from '@/types';
import type {PortalWorkspaceWithConfig} from '../../../utils/auth-helper';

async function SkillsCountBadge({
  mainPartnerId,
  client,
  workspace,
}: {
  mainPartnerId: ID;
  client: Client;
  workspace: PortalWorkspaceWithConfig;
}) {
  const count = await countMyProducts({
    mainPartnerId,
    client,
    workspace,
    type: MARKETPLACE_TYPE.SKILL,
  });

  return <>{count}</>;
}

export {SkillsCountBadge};
