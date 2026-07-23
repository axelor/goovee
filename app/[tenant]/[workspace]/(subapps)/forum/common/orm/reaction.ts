// ---- CORE IMPORTS ---- //
import type {WhereOptions} from '@goovee/orm';
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalForumReaction} from '@/goovee/.generated/models';
import type {User} from '@/types';
import {filterPrivate} from '@/orm/filter';
import {clone} from '@/utils';

type ReactionWhere = WhereOptions<AOSPortalForumReaction>;

// Comments are mail messages linked to their forum post via relatedId/relatedModel.
export const FORUM_POST_MODEL = 'com.axelor.apps.portal.db.ForumPost';

/**
 * Resolves the forum post a reaction target belongs to, scoped to `workspaceId`
 * and to groups the user is allowed to see — returns null when the target isn't
 * reachable. Prevents reacting to posts/comments in other workspaces or in
 * private groups the user cannot access (IDOR).
 */
export async function findReactionTargetPost({
  client,
  target,
  id,
  workspaceId,
  user,
}: {
  client: Client;
  target: 'post' | 'comment';
  id: string | number;
  workspaceId: string;
  user?: User;
}) {
  let postId: string | null = null;

  if (target === 'post') {
    postId = String(id);
  } else {
    const comment = await client.aOSMailMessage.findOne({
      where: {id: String(id)},
      select: {relatedId: true, relatedModel: true},
    });
    if (!comment || comment.relatedModel !== FORUM_POST_MODEL) return null;
    postId = comment.relatedId != null ? String(comment.relatedId) : null;
  }

  if (!postId) return null;

  const post = await client.aOSPortalForumPost.findOne({
    where: {
      id: postId,
      forumGroup: {
        workspace: {id: workspaceId},
        AND: [filterPrivate({user})],
      },
    },
    select: {id: true},
  });

  return post ?? null;
}

/**
 * Keeps only the post/comment ids whose (parent) post is in `workspaceId` and
 * in a group the user may see. Used to scope reaction-summary aggregates so
 * they can't be read for arbitrary ids elsewhere in the tenant.
 */
export async function filterVisibleReactionTargets({
  client,
  postIds,
  commentIds,
  workspaceId,
  user,
}: {
  client: Client;
  postIds: Array<string | number>;
  commentIds: Array<string | number>;
  workspaceId: string;
  user?: User;
}): Promise<{postIds: string[]; commentIds: string[]}> {
  const scopePosts = async (ids: string[]): Promise<Set<string>> => {
    if (!ids.length) return new Set();
    const rows = await client.aOSPortalForumPost.find({
      where: {
        id: {in: ids},
        forumGroup: {
          workspace: {id: workspaceId},
          AND: [filterPrivate({user})],
        },
      },
      select: {id: true},
    });
    return new Set((rows ?? []).map(r => String(r.id)));
  };

  const postIdStrs = postIds.map(String);
  const visiblePostIds = await scopePosts(postIdStrs);

  let allowedCommentIds: string[] = [];
  if (commentIds.length) {
    const comments = await client.aOSMailMessage.find({
      where: {id: {in: commentIds.map(String)}, relatedModel: FORUM_POST_MODEL},
      select: {id: true, relatedId: true},
    });
    const parentIds = [
      ...new Set(
        (comments ?? [])
          .map(c => (c.relatedId != null ? String(c.relatedId) : ''))
          .filter(Boolean),
      ),
    ];
    const visibleParents = await scopePosts(parentIds);
    allowedCommentIds = (comments ?? [])
      .filter(
        c => c.relatedId != null && visibleParents.has(String(c.relatedId)),
      )
      .map(c => String(c.id));
  }

  return {
    postIds: postIdStrs.filter(id => visiblePostIds.has(id)),
    commentIds: allowedCommentIds,
  };
}

/** True when `commentId` is a comment (mail message) of the given forum post. */
export async function isCommentOfPost({
  client,
  commentId,
  postId,
}: {
  client: Client;
  commentId: string | number;
  postId: string | number;
}): Promise<boolean> {
  const comment = await client.aOSMailMessage.findOne({
    where: {id: String(commentId)},
    select: {relatedId: true, relatedModel: true},
  });
  return (
    !!comment &&
    comment.relatedModel === FORUM_POST_MODEL &&
    comment.relatedId != null &&
    String(comment.relatedId) === String(postId)
  );
}

export const REACTION_LIKE = 'like';
export const REACTION_DISLIKE = 'dislike';

export type VoteValue = 'like' | 'dislike';

export type ReactionSummary = {
  likes: number;
  dislikes: number;
  score: number;
  myVote: VoteValue | null;
};

export type ReactionSummaries = {
  post: Record<string, ReactionSummary>;
  comment: Record<string, ReactionSummary>;
};

function emptySummary(): ReactionSummary {
  return {likes: 0, dislikes: 0, score: 0, myVote: null};
}

/**
 * Aggregate up/down votes (like/dislike ForumReaction rows) for the given posts
 * and comments, including the current partner's own vote.
 */
export async function getReactionSummaries({
  client,
  postIds = [],
  commentIds = [],
  partnerId,
}: {
  client: Client;
  postIds?: Array<string | number>;
  commentIds?: Array<string | number>;
  partnerId?: string | number | null;
}): Promise<ReactionSummaries> {
  const result: ReactionSummaries = {post: {}, comment: {}};
  postIds.forEach(id => (result.post[String(id)] = emptySummary()));
  commentIds.forEach(id => (result.comment[String(id)] = emptySummary()));

  const orFilters: ReactionWhere[] = [];
  if (postIds.length) orFilters.push({post: {id: {in: postIds.map(String)}}});
  if (commentIds.length)
    orFilters.push({reactionComment: {id: {in: commentIds.map(String)}}});
  if (!orFilters.length) return result;

  const rows = await client.aOSPortalForumReaction
    .find({
      where: {
        reactionSelect: {in: [REACTION_LIKE, REACTION_DISLIKE]},
        OR: orFilters,
      },
      select: {
        reactionSelect: true,
        post: {id: true},
        reactionComment: {id: true},
        author: {id: true},
      },
    })
    .then(clone);

  for (const r of rows) {
    const bucketKey: 'post' | 'comment' | null = r.post?.id
      ? 'post'
      : r.reactionComment?.id
        ? 'comment'
        : null;
    const targetId = r.post?.id ?? r.reactionComment?.id;
    if (!bucketKey || targetId == null) continue;
    const key = String(targetId);
    const bucket = result[bucketKey];
    const s = bucket[key] ?? (bucket[key] = emptySummary());
    if (r.reactionSelect === REACTION_LIKE) s.likes++;
    else if (r.reactionSelect === REACTION_DISLIKE) s.dislikes++;
    s.score = s.likes - s.dislikes;
    if (partnerId != null && String(r.author?.id) === String(partnerId)) {
      s.myVote = r.reactionSelect === REACTION_LIKE ? 'like' : 'dislike';
    }
  }

  return result;
}

/** The current partner's existing reaction on a single target (for toggling). */
export async function findUserReaction({
  client,
  target,
  id,
  partnerId,
}: {
  client: Client;
  target: 'post' | 'comment';
  id: string | number;
  partnerId: string | number;
}) {
  const where: ReactionWhere =
    target === 'post'
      ? {post: {id: String(id)}, author: {id: String(partnerId)}}
      : {reactionComment: {id: String(id)}, author: {id: String(partnerId)}};

  const rows = await client.aOSPortalForumReaction.find({
    where,
    select: {reactionSelect: true},
    take: 1,
  });

  return rows?.[0] ?? null;
}
