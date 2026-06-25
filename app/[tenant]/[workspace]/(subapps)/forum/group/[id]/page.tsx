import {notFound, redirect, unauthorized} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {User} from '@/types';
import {clone} from '@/utils';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getWorkspaceConfig} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {
  findGroupById,
  findUser,
  findGroupsByMembers,
  findGroups,
} from '@/subapps/forum/common/orm/forum';
import type {Group, MemberGroup} from '@/subapps/forum/common/types/forum';
import {
  FORUM_CONTENT,
  GROUPS_ORDER_BY,
  MENU,
} from '@/subapps/forum/common/constants';
import {ForumSkeleton} from '@/subapps/forum/common/ui/components/skeletons';
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
  const type = searchParams?.type ?? FORUM_CONTENT.POSTS;

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
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

  const {user, client} = access;
  const userId = user?.id as string;

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  const workspace = clone({...access.workspace, config});

  const groupId = params.id as string;

  const groups = await findGroups({
    workspaceURL: workspace.url,
    client,
    user,
  }).then(clone);

  const memberGroups = (
    userId
      ? await findGroupsByMembers({
          id: userId,
          orderBy: GROUPS_ORDER_BY,
          workspaceID: workspace?.id,
          client,
          user,
        })
      : []
  ) as MemberGroup[];

  const memberGroupIDs = memberGroups
    ?.map(group => group.forumGroup?.id)
    .filter((id): id is string => Boolean(id));

  const nonMemberGroups = groups.filter(group => {
    return !memberGroupIDs?.includes(group.id);
  }) as Group[];

  const selectedGroup = (await findGroupById(
    groupId,
    workspace?.id!,
    client,
    user,
  ).then(clone)) as Group | null;

  const $user = (await findUser({userId, client}).then(clone)) as User;

  if (!selectedGroup) {
    return notFound();
  }

  return (
    <div className="flex flex-col h-full flex-1">
      <div className="hidden lg:block">
        <NavMenu items={MENU} />
      </div>
      <Hero selectedGroup={selectedGroup} workspace={workspace} />
      <div className="container py-6 mx-auto grid grid-cols-1 md:grid-cols-[17.563rem_1fr] gap-5">
        <GroupControls
          memberGroups={memberGroups}
          nonMemberGroups={nonMemberGroups}
          user={$user}
          selectedGroup={selectedGroup}
        />
        <div>
          <ComposePost
            user={$user}
            memberGroups={memberGroups}
            selectedGroup={selectedGroup}
          />
          <Tabs activeTab={type} />
          <Suspense fallback={<ThreadListSkeleton />}>
            {type === FORUM_CONTENT.POSTS && (
              <GroupPostsContent
                memberGroupIDs={memberGroupIDs}
                params={params}
                searchParams={searchParams}
                client={client}
                user={user ?? null}
                workspace={workspace}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default async function Page(props: {
  params: Promise<{
    id: string;
    type: string;
    tenant: string;
    workspace: string;
  }>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <Suspense fallback={<ForumSkeleton />}>
      <ForumGroup params={params} searchParams={searchParams} />
    </Suspense>
  );
}
