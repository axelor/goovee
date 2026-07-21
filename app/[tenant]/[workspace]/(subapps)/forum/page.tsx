import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {getForumConfig} from '@/subapps/forum/common/orm/config';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES, DEFAULT_LIMIT} from '@/constants';
import {User} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {GROUPS_ORDER_BY} from '@/subapps/forum/common/constants';
import {
  findCommentCounts,
  findGroups,
  findGroupsByMembers,
  findPosts,
  findRecentlyActivePosts,
  findUser,
} from '@/subapps/forum/common/orm/forum';
import {
  ForumFeed,
  ForumSidebar,
  GroupControls,
} from '@/subapps/forum/common/ui/components';
import {Group, MemberGroup} from '@/subapps/forum/common/types/forum';

export default async function Page(props: {
  params: Promise<{type: string; tenant: string; workspace: string}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
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

  const {user} = access;
  const {client} = access.tenant;
  const userId = user?.id as string;

  const config = await getForumConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  const workspace = clone(access.workspace);

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

  const $user = (await findUser({userId, client}).then(clone)) as User;

  const {posts = [], pageInfo} = await findPosts({
    sort: searchParams?.sort,
    search: searchParams?.search,
    limit: searchParams?.limit ? Number(searchParams.limit) : DEFAULT_LIMIT,
    workspaceID: workspace?.id!,
    groupIDs,
    client,
    user,
    memberGroupIDs,
  }).then(clone);

  const replyCounts = await findCommentCounts({
    postIds: posts.map(p => p.id),
    client,
  });
  const postsWithCounts = posts.map(p => ({
    ...p,
    replyCount: replyCounts[String(p.id)] ?? 0,
  }));

  const recent = await findRecentlyActivePosts({
    workspaceID: workspace?.id!,
    client,
    user,
    limit: 3,
  }).then(clone);

  const stats = {
    discussions: Number(pageInfo?.count ?? posts.length),
    groups: groups.length,
    myGroups: memberGroups.length,
  };

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container py-8 mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start mb-20 lg:mb-0">
        <div className="min-w-0">
          <ForumFeed
            posts={postsWithCounts}
            groups={memberGroups.map(g => g.forumGroup)}
            canPost={Boolean($user?.id)}
          />
        </div>
        <aside className="lg:sticky lg:top-6 flex flex-col gap-5">
          <ForumSidebar
            stats={stats}
            trending={recent.map(r => ({id: r.id, title: r.title}))}
          />
          <GroupControls
            memberGroups={memberGroups}
            nonMemberGroups={nonMemberGroups}
            user={$user}
            selectedGroup={null}
          />
        </aside>
      </div>
    </div>
  );
}
