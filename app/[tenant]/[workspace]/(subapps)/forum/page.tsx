import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {isCommentEnabled} from '@/comments';
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
  countPosts,
  findCommentCounts,
  findGroups,
  findGroupsByMembers,
  findPosts,
  findRecentlyActivePosts,
  findUser,
} from '@/subapps/forum/common/orm/forum';
import {ForumFeed, ForumAside} from '@/subapps/forum/common/ui/components';
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

  // Feed group filter: `groups` (repeated query param) narrows the feed to the
  // visible groups it names; empty means all.
  const requestedGroups = new Set(
    ([] as string[]).concat(searchParams?.groups ?? []),
  );
  const selectedGroupIDs = groupIDs.filter(id => requestedGroups.has(id));
  const feedGroupIDs = selectedGroupIDs.length ? selectedGroupIDs : groupIDs;

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
    groupIDs: feedGroupIDs,
    client,
    user,
    memberGroupIDs,
  }).then(clone);

  const commentsEnabled = isCommentEnabled({
    subapp: SUBAPP_CODES.forum,
    config,
  });

  /* Reply counts are only rendered when the workspace has comments enabled, so
   * skip the count query entirely when it does not. */
  const replyCounts = commentsEnabled
    ? await findCommentCounts({postIds: posts.map(p => p.id), client})
    : {};
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

  // Community total stays a true total, independent of the feed group filter.
  const totalDiscussions = await countPosts({
    workspaceID: workspace?.id!,
    groupIDs,
    client,
    user,
  });

  const stats = {
    discussions: totalDiscussions,
    groups: groups.length,
    myGroups: memberGroups.length,
  };

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container py-8 mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start mb-20 lg:mb-0">
        <div className="min-w-0">
          <ForumFeed
            posts={postsWithCounts}
            pageInfo={pageInfo}
            groupIDs={feedGroupIDs}
            memberGroupIDs={memberGroupIDs}
            groups={memberGroups.map(g => g.forumGroup)}
            canPost={Boolean($user?.id)}
            commentsEnabled={commentsEnabled}
          />
        </div>
        <aside className="lg:sticky lg:top-6 flex flex-col gap-5">
          <ForumAside
            stats={stats}
            trending={recent.map(r => ({id: r.id, title: r.title}))}
            memberGroups={memberGroups}
            nonMemberGroups={nonMemberGroups}
            user={$user}
          />
        </aside>
      </div>
    </div>
  );
}
