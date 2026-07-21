import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {GROUPS_ORDER_BY} from '@/subapps/forum/common/constants';
import {
  findCommentCounts,
  findGroupMeta,
  findGroupsByMembers,
  findPosts,
  findRecentlyActivePosts,
  findUser,
} from '@/subapps/forum/common/orm/forum';
import {ForumDetail} from '@/subapps/forum/common/ui/components';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; 'post-id': string}>;
}) {
  const params = await props.params;
  const postId = params['post-id'];

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
  const workspace = clone(access.workspace);

  const memberGroups = userId
    ? await findGroupsByMembers({
        id: userId,
        orderBy: GROUPS_ORDER_BY,
        workspaceID: workspace?.id!,
        client,
        user,
      })
    : [];
  const memberGroupIDs = memberGroups
    .map(g => g?.forumGroup?.id)
    .filter((id): id is string => id != null);

  const {posts = []} = await findPosts({
    ids: [postId],
    limit: 1,
    workspaceID: workspace?.id!,
    client,
    user,
    memberGroupIDs,
  }).then(clone);

  const post = posts?.[0];
  if (!post) return notFound();

  const [groupMeta, recent, $user] = await Promise.all([
    findGroupMeta({groupId: post.forumGroup?.id, client}),
    findRecentlyActivePosts({
      workspaceID: workspace?.id!,
      client,
      user,
      limit: 5,
    }).then(clone),
    findUser({userId, client}).then(clone),
  ]);

  const related = recent.filter(r => String(r.id) !== String(postId));
  const relatedCounts = await findCommentCounts({
    postIds: related.map(r => r.id),
    client,
  });
  const relatedWithCounts = related.map(r => ({
    ...r,
    replyCount: relatedCounts[String(r.id)] ?? 0,
  }));

  const replyCount =
    (await findCommentCounts({postIds: [postId], client}))[String(postId)] ?? 0;

  const forumBase = `${workspaceURI}/${SUBAPP_CODES.forum}`;

  return (
    <ForumDetail
      post={post}
      replyCount={replyCount}
      groupMeta={groupMeta}
      related={relatedWithCounts}
      currentUser={{
        name: user?.name ?? (user as any)?.simpleFullName,
        pictureId: ($user as any)?.picture?.id,
      }}
      canComment={Boolean(post.isMember)}
      isAuthor={Boolean(userId) && String(post.author?.id) === String(userId)}
      backHref={forumBase}
    />
  );
}
