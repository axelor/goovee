import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {IdSchema, WorkspaceURLSchema} from '@/utils/validators';
import {uploadTokenSchema} from '@/lib/core/upload/validators';
import {ORDER_BY} from '@/constants';
import {SORT_TYPE} from '@/comments';

// ---- LOCAL IMPORTS ---- //
import {MAX_FORUM_ATTACHMENTS} from '@/subapps/forum/common/constants';

const WorkspaceURISchema = z.string().min(1);

/* A forum post attachment references its pre-staged file by single-use claim
 * token (redeemed server-side when the post is created); `title` is the
 * per-file caption/alt text stored on the join record. */
export const PostAttachmentSchema = z.object({
  token: uploadTokenSchema,
  title: z.string(),
});
export type PostAttachmentInput = z.infer<typeof PostAttachmentSchema>;

export const PinGroupSchema = z.object({
  isPin: z.boolean(),
  id: IdSchema,
  groupID: IdSchema,
  workspaceURL: WorkspaceURLSchema,
  workspaceURI: WorkspaceURISchema,
});
export type PinGroupInput = z.infer<typeof PinGroupSchema>;

export const ExitGroupSchema = z.object({
  id: IdSchema,
  groupID: IdSchema,
  workspaceURL: WorkspaceURLSchema,
  workspaceURI: WorkspaceURISchema,
});
export type ExitGroupInput = z.infer<typeof ExitGroupSchema>;

export const JoinGroupSchema = z.object({
  groupID: IdSchema,
  userId: IdSchema,
  workspaceURL: WorkspaceURLSchema,
  workspaceURI: WorkspaceURISchema,
});
export type JoinGroupInput = z.infer<typeof JoinGroupSchema>;

export const AddGroupNotificationSchema = z.object({
  id: IdSchema,
  groupID: IdSchema,
  notificationType: z.string().min(1),
  workspaceURL: WorkspaceURLSchema,
  workspaceURI: WorkspaceURISchema,
});
export type AddGroupNotificationInput = z.infer<
  typeof AddGroupNotificationSchema
>;

export const GetSubscribersByGroupSchema = z.object({
  groupID: IdSchema,
  workspaceURL: WorkspaceURLSchema,
});
export type GetSubscribersByGroupInput = z.infer<
  typeof GetSubscribersByGroupSchema
>;

export const FindMediaSchema = z.object({
  id: IdSchema,
  workspaceURL: WorkspaceURLSchema,
  archived: z.boolean().optional(),
});
export type FindMediaInput = z.infer<typeof FindMediaSchema>;

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

/* Whitelist the only orderBy shape the UI sends — order forum-group rows by
 * name ascending/descending — instead of forwarding an arbitrary object into
 * the ORM `.find()`. Unknown directions normalize to undefined (unordered);
 * unknown keys are stripped by the object schema. */
const OrderDirectionSchema = z
  .string()
  .nullish()
  .transform(v => {
    const upper = v?.toUpperCase();
    return upper === ORDER_BY.ASC || upper === ORDER_BY.DESC
      ? (upper as typeof ORDER_BY.ASC | typeof ORDER_BY.DESC)
      : undefined;
  });

export const FetchGroupsByMembersSchema = z.object({
  id: IdSchema,
  searchKey: z.string().optional(),
  orderBy: z
    .object({
      forumGroup: z.object({name: OrderDirectionSchema}),
    })
    .optional(),
  workspaceID: IdSchema,
  workspaceURL: z.string(),
});
export type FetchGroupsByMembersInput = z.input<
  typeof FetchGroupsByMembersSchema
>;
