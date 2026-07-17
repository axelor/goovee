// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import {clone} from '@/utils';

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

  const orFilters: any[] = [];
  if (postIds.length) orFilters.push({post: {id: {in: postIds}}});
  if (commentIds.length)
    orFilters.push({reactionComment: {id: {in: commentIds}}});
  if (!orFilters.length) return result;

  const rows = await client.aOSPortalForumReaction
    .find({
      where: {
        reactionSelect: {in: [REACTION_LIKE, REACTION_DISLIKE]},
        OR: orFilters,
      } as any,
      select: {
        reactionSelect: true,
        post: {id: true},
        reactionComment: {id: true},
        author: {id: true},
      },
    })
    .then(clone);

  for (const r of rows as any[]) {
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
}): Promise<{id: string; version: number; reactionSelect: string} | null> {
  const where =
    target === 'post'
      ? {post: {id}, author: {id: partnerId}}
      : {reactionComment: {id}, author: {id: partnerId}};

  const rows = await client.aOSPortalForumReaction.find({
    where: where as any,
    select: {reactionSelect: true},
    take: 1,
  });

  return (rows?.[0] as any) ?? null;
}
