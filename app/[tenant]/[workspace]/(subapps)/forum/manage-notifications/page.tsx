// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {ORDER_BY, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import type {MemberGroup} from '@/subapps/forum/common/types/forum';
import {findGroupsByMembers} from '@/subapps/forum/common/orm/forum';
import {ForumNotifSettings} from '@/subapps/forum/common/ui/components';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const access = await ensureAccess({
    code: SUBAPP_CODES.forum,
    allowGuest: false,
  });

  if (!access.ok) return denyPage(access);

  const {user} = access;
  const {client} = access.tenant;

  const groups = (await findGroupsByMembers({
    id: user.id,
    orderBy: {forumGroup: {name: ORDER_BY.ASC}},
    workspaceID: access.workspace.id,
    client,
    user,
  }).then(clone)) as MemberGroup[];

  return <ForumNotifSettings groups={groups} />;
}
