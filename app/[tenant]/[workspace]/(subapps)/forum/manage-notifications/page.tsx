import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {ORDER_BY, SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import type {MemberGroup} from '@/subapps/forum/common/types/forum';
import {findGroupsByMembers} from '@/subapps/forum/common/orm/forum';
import {ForumNotifSettings} from '@/subapps/forum/common/ui/components';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.forum,
    allowGuest: false,
  });

  if (!access.ok) {
    if (
      access.reason === 'workspace-not-found' ||
      access.reason === 'app-not-installed'
    ) {
      notFound();
    }
    if (!access.user) {
      redirect(
        getLoginURL({
          callbackurl: await getCurrentPath(),
          workspaceURI,
          [SEARCH_PARAMS.TENANT_ID]: tenant,
        }),
      );
    }
    unauthorized();
  }

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
