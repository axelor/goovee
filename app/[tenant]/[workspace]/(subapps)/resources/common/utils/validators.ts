import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {IdSchema, WorkspaceURLSchema} from '@/utils/validators';
import {uploadTokenSchema} from '@/lib/core/upload/validators';

// ---- LOCAL IMPORTS ---- //
import {MAX_RESOURCE_FILES} from '@/subapps/resources/common/constants';

export const FindDmsFilesSchema = z.object({
  search: z.string().optional(),
  workspaceURL: WorkspaceURLSchema,
});
export type FindDmsFilesInput = z.infer<typeof FindDmsFilesSchema>;

/* One file to create: its metadata plus the single-use claim token of the file
 * pre-staged via the upload route, redeemed server-side when the aOSDMSFile row
 * is created. */
const UploadFileSchema = z.object({
  title: z.string().min(2, {error: 'Title is required'}),
  description: z.string(),
  token: uploadTokenSchema,
});
export type UploadFileInput = z.infer<typeof UploadFileSchema>;

export const UploadSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  parent: IdSchema,
  values: z
    .array(UploadFileSchema)
    .min(1, {error: 'Single file is required to create resource'})
    .max(MAX_RESOURCE_FILES, {
      error: `You can add up to ${MAX_RESOURCE_FILES} files`,
    }),
});
export type UploadInput = z.infer<typeof UploadSchema>;

export const CreateCategorySchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  title: z
    .string({
      error: issue =>
        issue.input === undefined ? 'Title is required' : undefined,
    })
    .trim()
    .min(1, {error: 'Title is required'}),
  description: z.string().optional(),
  icon: z.string().optional(),
  parent: IdSchema,
  color: z.string().optional(),
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
