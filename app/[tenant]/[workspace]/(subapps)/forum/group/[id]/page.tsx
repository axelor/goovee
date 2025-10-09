import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {User} from '@/types';
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {
  findGroupById,
  findUser,
  findGroupsByMembers,
  findGroups,
} from '@/subapps/forum/common/orm/forum';
import {
  FORUM_CONTENT,
  GROUPS_ORDER_BY,
  MENU,
} from '@/subapps/forum/common/constants';
import {ForumSkeleton} from '@/subapps/forum/common/ui/components/skeletons';
import ForumContextProvider from '@/subapps/forum/common/ui/context';
import {
  NavMenu,
  Tabs,
  GroupControls,
  Hero,
} from '@/subapps/forum/common/ui/components';
import {ComposePost} from '@/app/[tenant]/[workspace]/(subapps)/forum/common/ui/components';
import {ThreadListSkeleton} from '@/subapps/forum/common/ui/components';
import {GroupPostsContent} from './group-post-content';

async function ForumGroup({
  params,
  searchParams,
}: {
  params: {
    id: string;
    tenant: string;
    workspace: string;
  };
  searchParams: {[key: string]: string | undefined};
}) {
  const session = await getSession();
  const user = session?.user as User;
  const userId = user?.id as string;
  const type = searchParams?.type ?? FORUM_CONTENT.POSTS;

  const {workspaceURL, tenant} = workspacePathname(params);

  const workspace: any = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const groupId = params.id as string;

  const groups = await findGroups({workspace, tenantId: tenant, user}).then(
    clone,
  );

  const memberGroups: any = userId
    ? await findGroupsByMembers({
        id: userId,
        orderBy: GROUPS_ORDER_BY,
        workspaceID: workspace?.id,
        tenantId: tenant,
        user,
      })
    : [];

  const memberGroupIDs = memberGroups.map(
    (group: any) => group?.forumGroup?.id,
  );

  const nonMemberGroups: any = groups.filter((group: any) => {
    return !memberGroupIDs.includes(group.id);
  });

  const selectedGroup: any = await findGroupById(
    groupId,
    workspace?.id!,
    tenant,
    user,
  ).then(clone);

  const $user = (await findUser({userId, tenantId: tenant}).then(
    clone,
  )) as User;

  if (!selectedGroup) {
    return notFound();
  }

  return (
    <ForumContextProvider
      value={{
        memberGroups,
        nonMemberGroups,
        selectedGroup,
        user: $user,
        workspace,
      }}>
      <div className="flex flex-col h-full flex-1">
        <div className="hidden lg:block">
          <NavMenu items={MENU} />
        </div>
        <Hero />
        <div className="container py-6 mx-auto grid grid-cols-1 md:grid-cols-[17.563rem_1fr] gap-5">
          <GroupControls />
          <div>
            <ComposePost />
            <Tabs activeTab={type} />
            <Suspense fallback={<ThreadListSkeleton />}>
              {type === FORUM_CONTENT.POSTS && (
                <GroupPostsContent
                  memberGroupIDs={memberGroupIDs}
                  params={params}
                  searchParams={searchParams}
                  tenant={tenant}
                  user={user}
                  workspace={workspace}
                />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </ForumContextProvider>
  );
}

export default async function Page({
  params,
  searchParams,
}: {
  params: {id: string; type: string; tenant: string; workspace: string};
  searchParams: {[key: string]: string | undefined};
}) {
  return (
    <Suspense fallback={<ForumSkeleton />}>
      <ForumGroup params={params} searchParams={searchParams} />
    </Suspense>
  );
}
