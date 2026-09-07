import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {IdSchema, WorkspaceURLSchema} from '@/utils/validators';
import {uploadTokenSchema} from '@/lib/core/upload/validators';
import {SORT_TYPE} from '@/comments';

// ---- LOCAL IMPORTS ---- //
import {
  MAX_FORUM_ATTACHMENTS,
  NOTIFICATION_VALUES,
} from '@/subapps/forum/common/constants';

const WorkspaceURISchema = z.string().min(1);

/* A forum post attachment references its pre-staged file by single-use claim
 * token (redeemed server-side when the post is created); `title` is the
 * per-file caption/alt text stored on the join record. */
export const PostAttachmentSchema = z.object({
  token: uploadTokenSchema,
  title: z.string(),
});
export type PostAttachmentInput = z.infer<typeof PostAttachmentSchema>;

export const ExitGroupSchema = z.object({
  id: IdSchema,
  groupID: IdSchema,
  workspaceURL: WorkspaceURLSchema,
  workspaceURI: WorkspaceURISchema,
});
export type ExitGroupInput = z.infer<typeof ExitGroupSchema>;

export const JoinGroupSchema = z.object({
  groupID: IdSchema,
  workspaceURL: WorkspaceURLSchema,
  workspaceURI: WorkspaceURISchema,
});
export type JoinGroupInput = z.infer<typeof JoinGroupSchema>;

/* The 4 known notification levels, unlike the free-form string the previous
 * per-row action accepted. */
export const NotificationValueSchema = z.enum([
  NOTIFICATION_VALUES.ALL,
  NOTIFICATION_VALUES.ALL_ON_MY_POST,
  NOTIFICATION_VALUES.NEW_COMMENTS_ON_MY_POST,
  NOTIFICATION_VALUES.NONE,
]);

export const SaveGroupNotificationsSchema = z.object({
  prefs: z
    .array(
      z.object({
        id: IdSchema,
        groupID: IdSchema,
        notificationType: NotificationValueSchema,
      }),
    )
    .min(1),
  workspaceURL: WorkspaceURLSchema,
  workspaceURI: WorkspaceURISchema,
});
export type SaveGroupNotificationsInput = z.infer<
  typeof SaveGroupNotificationsSchema
>;

export const GetSubscribersByGroupSchema = z.object({
  groupID: IdSchema,
  workspaceURL: WorkspaceURLSchema,
});
export type GetSubscribersByGroupInput = z.infer<
  typeof GetSubscribersByGroupSchema
>;

export const AddPostSchema = z.object({
  group: z.object({id: IdSchema}),
  title: z.string().trim().min(1),
  content: z.string(),
  workspaceURL: WorkspaceURLSchema,
  workspaceURI: WorkspaceURISchema,
  attachments: z
    .array(PostAttachmentSchema)
    .max(MAX_FORUM_ATTACHMENTS)
    .optional(),
});
export type AddPostInput = z.infer<typeof AddPostSchema>;

/* `sort` arrives as a raw URL param. Unknown values were always tolerated
 * (findPosts falls back to default ordering), so normalize to a known
 * SORT_TYPE or undefined rather than rejecting the whole request. */
const SortSchema = z
  .string()
  .nullish()
  .transform(v =>
    v && (Object.values(SORT_TYPE) as string[]).includes(v)
      ? (v as SORT_TYPE)
      : undefined,
  );

export const FetchPostsSchema = z.object({
  sort: SortSchema,
  limit: z.number().int().positive().optional(),
  page: z.union([z.string(), z.number()]).optional(),
  search: z.string().optional(),
  workspaceURL: WorkspaceURLSchema,
  memberGroupIDs: z.array(IdSchema).optional(),
  groupIDs: z.array(IdSchema).optional(),
});
export type FetchPostsInput = z.input<typeof FetchPostsSchema>;

export const ToggleReactionSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  target: z.enum(['post', 'comment']),
  id: IdSchema,
  value: z.enum(['like', 'dislike']),
});
export type ToggleReaction = z.infer<typeof ToggleReactionSchema>;

export const FindSearchPostsSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  search: z.string().trim().optional(),
});

export const ReactionSummarySchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  postIds: z.array(IdSchema).optional().default([]),
  commentIds: z.array(IdSchema).optional().default([]),
});

export const SetBestReplySchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  postId: IdSchema,
  commentId: IdSchema.nullable(),
});

export const SetPostStatusSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  postId: IdSchema,
  resolved: z.boolean(),
});
