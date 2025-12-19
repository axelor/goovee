import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {User} from '@/types';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {
  FORUM_CONTENT,
  GROUPS_ORDER_BY,
  MENU,
} from '@/subapps/forum/common/constants';
import {
  findGroups,
  findGroupsByMembers,
  findUser,
} from '@/subapps/forum/common/orm/forum';
import {ForumSkeleton} from '@/subapps/forum/common/ui/components/skeletons/forum-sekeleton';
import {
  NavMenu,
  Tabs,
  Hero,
  GroupControls,
  ThreadListSkeleton,
} from '@/subapps/forum/common/ui/components';
import ForumContextProvider from '@/subapps/forum/common/ui/context';
import {ComposePost} from '@/subapps/forum/common/ui/components';
import {PostsContent} from './post-content';

async function Forum({
  params,
  searchParams,
}: {
  params: {type: string; tenant: string; workspace: string};
  searchParams: {[key: string]: string | undefined};
}) {
  const session = await getSession();
  const user = session?.user as User;
  const userId = user?.id as string;
  const type = searchParams?.type || FORUM_CONTENT.POSTS;

  const {workspaceURL, tenant} = workspacePathname(params);

  const workspace: any = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const groups = await findGroups({
    workspace: workspace!,
    tenantId: tenant,
    user,
  }).then(clone);

  const groupIDs = groups.map((group: any) => group.id);

  const memberGroups: any = userId
    ? await findGroupsByMembers({
        id: userId,
        orderBy: GROUPS_ORDER_BY,
        workspaceID: workspace?.id!,
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

  const $user = (await findUser({
    userId,
    tenantId: tenant,
  }).then(clone)) as User;

  return (
    <ForumContextProvider
      value={{
        nonMemberGroups,
        memberGroups,
        selectedGroup: null,
        user: $user,
        workspace,
      }}>
      <div className="flex flex-col h-full flex-1">
        <div className="hidden lg:block">
          <NavMenu items={MENU} />
        </div>
        <Hero />
        <div className="container py-6 mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          <GroupControls />
          <div className="col-span-2">
            <ComposePost />
            <Tabs activeTab={type} />
            <Suspense fallback={<ThreadListSkeleton />}>
              {type === FORUM_CONTENT.POSTS && (
                <PostsContent
                  searchParams={searchParams}
                  workspace={workspace}
                  groupIDs={groupIDs}
                  memberGroupIDs={memberGroupIDs}
                  user={user}
                  tenant={tenant}
                />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </ForumContextProvider>
  );
}

export default async function Page(
  props: {
    params: Promise<{type: string; tenant: string; workspace: string}>;
    searchParams: Promise<{[key: string]: string | undefined}>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <Suspense fallback={<ForumSkeleton />}>
      <Forum params={params} searchParams={searchParams} />
    </Suspense>
  );
}
