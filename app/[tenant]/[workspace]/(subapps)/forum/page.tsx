import {notFound, redirect, unauthorized} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getWorkspaceConfig} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {User} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {FORUM_CONTENT, GROUPS_ORDER_BY} from '@/subapps/forum/common/constants';
import {
  findGroups,
  findGroupsByMembers,
  findUser,
} from '@/subapps/forum/common/orm/forum';
import {
  Tabs,
  Hero,
  GroupControls,
  ThreadListSkeleton,
} from '@/subapps/forum/common/ui/components';
import {ComposePost} from '@/subapps/forum/common/ui/components';
import {Group, MemberGroup} from '@/subapps/forum/common/types/forum';
import {PostsContent} from './post-content';

export default async function Page(props: {
  params: Promise<{type: string; tenant: string; workspace: string}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const type = searchParams?.type || FORUM_CONTENT.POSTS;

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

  const groups = await findGroups({
    workspaceURL: workspace.url,
    client,
    user,
  }).then(clone);

  const groupIDs = groups.map(group => group.id);

  const memberGroups = (
    userId
      ? await findGroupsByMembers({
          id: userId,
          orderBy: GROUPS_ORDER_BY,
          workspaceID: workspace.id,
          client,
          user,
        })
      : []
  ) as MemberGroup[];

  const memberGroupIDs = memberGroups
    ?.map(group => group.forumGroup.id)
    .filter((id): id is string => Boolean(id));

  const nonMemberGroups = groups.filter(group => {
    return !memberGroupIDs?.includes(group.id);
  }) as Group[];

  const $user = (await findUser({
    userId,
    client,
  }).then(clone)) as User;

  return (
    <div className="flex flex-col h-full flex-1">
      <div className="hidden lg:block">{/* <NavMenu items={MENU} /> */}</div>
      <Hero selectedGroup={null} workspace={workspace} />
      <div className="container py-6 mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
        <GroupControls
          memberGroups={memberGroups}
          nonMemberGroups={nonMemberGroups}
          user={$user}
          selectedGroup={null}
        />
        <div className="col-span-2">
          <ComposePost
            user={$user}
            memberGroups={memberGroups}
            selectedGroup={null}
          />
          <Tabs activeTab={type} />
          <Suspense fallback={<ThreadListSkeleton />}>
            {type === FORUM_CONTENT.POSTS && (
              <PostsContent
                searchParams={searchParams}
                workspace={workspace}
                groupIDs={groupIDs}
                memberGroupIDs={memberGroupIDs}
                user={user ?? null}
                client={client}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
