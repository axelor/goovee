import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {getForumConfig} from '@/subapps/forum/common/orm/config';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES, DEFAULT_LIMIT} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {GROUPS_ORDER_BY} from '@/subapps/forum/common/constants';
import {
  findCommentCounts,
  findGroupById,
  findGroupMeta,
  findGroupsByMembers,
  findPostsByGroupId,
} from '@/subapps/forum/common/orm/forum';
import {getReactionSummaries} from '@/subapps/forum/common/orm/reaction';
import {ForumGroup} from '@/subapps/forum/common/ui/components';

export default async function Page(props: {
  params: Promise<{id: string; tenant: string; workspace: string}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

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

  const groupId = params.id;

  const group = await findGroupById(groupId, workspace.id, client, user).then(
    clone,
  );
  if (!group) return notFound();

  const memberGroups = userId
    ? await findGroupsByMembers({
        id: userId,
        orderBy: GROUPS_ORDER_BY,
        workspaceID: workspace.id,
        client,
        user,
      })
    : [];
  const memberGroupIDs = memberGroups
    .map(g => g?.forumGroup?.id)
    .filter((id): id is string => id != null);
  const memberRecord = memberGroups.find(
    g => String(g?.forumGroup?.id) === String(groupId),
  );

  const groupMeta = await findGroupMeta({groupId, client});

  const {posts = []} = await findPostsByGroupId({
    id: groupId,
    workspaceID: workspace.id,
    sort: searchParams?.sort,
    search: searchParams?.search,
    limit: searchParams?.limit ? Number(searchParams.limit) : DEFAULT_LIMIT,
    client,
    user,
    memberGroupIDs,
  }).then(clone);

  const postIds = posts.map(p => p.id);
  const replyCounts = await findCommentCounts({postIds, client});
  const reactions = await getReactionSummaries({
    client,
    postIds,
    partnerId: userId,
  });
  const scoreByPost: Record<string, number> = {};
  for (const [id, s] of Object.entries(reactions.post)) {
    scoreByPost[id] = s.score;
  }
  const postsWithCounts = posts.map(p => ({
    ...p,
    replyCount: replyCounts[String(p.id)] ?? 0,
  }));

  const forumBase = `${workspaceURI}/${SUBAPP_CODES.forum}`;

  return (
    <ForumGroup
      group={{id: group.id, name: group.name}}
      groupMeta={groupMeta}
      posts={postsWithCounts}
      scoreByPost={scoreByPost}
      isMember={Boolean(memberRecord)}
      memberRecordId={memberRecord?.id}
      userId={userId}
      groups={memberGroups.map(g => g.forumGroup)}
      canPost={Boolean(memberRecord)}
      backHref={forumBase}
    />
  );
}
