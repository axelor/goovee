import z from 'zod';

import {MAX_FILE_SIZE, SORT_TYPE} from '../constants';

const attachmentSchema = z.object({
  title: z.string(),
  description: z.string(),
  file: z
    .any()
    .refine(file => file, 'File is required.')
    .refine(file => file.size <= MAX_FILE_SIZE, `Max file size is 20MB.`),
});

export const formSchema = z
  .object({
    attachments: z.array(attachmentSchema),
    text: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasFile = !!data.attachments?.length;

    if (!hasFile && (!data.text || data.text.trim().length === 0)) {
      ctx.addIssue({
        path: ['text'],
        message: 'Comment is required',
        code: 'custom',
      });
    }
  });

const IDSchema = z.union([z.string(), z.number()]);

export const FetchCommentsPropsSchema = z.object({
  workspaceURL: z.string(),
  recordId: IDSchema,
  sort: z.enum(SORT_TYPE).optional(),
  limit: z.number().optional(),
  skip: z.number().optional(),
  exclude: z.array(IDSchema).optional(),
  showRepliesInMainThread: z.boolean().optional(),
});

export const CreateCommentPropsSchema = z.object({
  data: formSchema,
  workspaceURL: z.string(),
  recordId: IDSchema,
  parentId: IDSchema.optional(),
  showRepliesInMainThread: z.boolean().optional(),
});

const PictureSchema = z.object({
  id: IDSchema,
  version: z.number(),
});

const AttachmentFileSchema = z.object({
  id: IDSchema,
  version: z.number(),
  fileName: z.string().nullish(),
});

const MailMessageFileSchema = z.object({
  id: IDSchema,
  version: z.number(),
  attachmentFile: AttachmentFileSchema.nullish(),
});

const UserSchema = z.object({
  id: IDSchema,
  version: z.number(),
  fullName: z.string().nullish(),
});

const PartnerSchema = z.object({
  id: IDSchema,
  version: z.number(),
  picture: PictureSchema.nullish(),
  simpleFullName: z.string().nullish(),
  name: z.string().nullish(),
});

const MailMessageSchema = z.object({
  id: IDSchema,
  version: z.number(),
  body: z.string().nullish(),
  publicBody: z.string().nullish(),
  createdOn: z.union([z.date(), z.string()]).nullish(),
  partner: PartnerSchema.nullish(),
  createdBy: UserSchema.nullish(),
  note: z.string().nullish(),
  mailMessageFileList: z.array(MailMessageFileSchema).nullish(),
});

export const CommentSchema = MailMessageSchema.extend({
  isPublicNote: z.boolean().nullish(),
  parentMailMessage: MailMessageSchema.nullish(),
  childMailMessages: z.array(MailMessageSchema).nullish(),
  _count: z.string().or(z.number()).nullish(),
  _cursor: z.string().nullish(),
  _hasNext: z.boolean().nullish(),
  _hasPrev: z.boolean().nullish(),
});

export const CommentsSchema = z.array(CommentSchema);

const TrackSchema = z.object({
  name: z.string(),
  title: z.string(),
  value: z.string(),
  oldValue: z.string().optional(),
});

export const TrackObjectSchema = z.object({
  title: z.string().optional(),
  tracks: z.array(TrackSchema).optional(),
});

export type TrackObject = z.infer<typeof TrackObjectSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type Picture = z.infer<typeof PictureSchema>;
export type AttachmentFile = z.infer<typeof AttachmentFileSchema>;
export type MailMessageFile = z.infer<typeof MailMessageFileSchema>;
export type User = z.infer<typeof UserSchema>;
export type Partner = z.infer<typeof PartnerSchema>;
export type MailMessage = z.infer<typeof MailMessageSchema>;
export type CommentData = z.infer<typeof formSchema>;
export type CommentAttachment = z.infer<typeof attachmentSchema>;
export type FetchCommentsProps = z.infer<typeof FetchCommentsPropsSchema>;
export type CreateCommentProps = z.infer<typeof CreateCommentPropsSchema>;
