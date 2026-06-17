import {z} from 'zod';
import {WorkspaceURLSchema} from '@/utils/validators';
import {uploadTokenSchema} from '@/lib/core/upload/validators';

/* `token` redeems a staged upload (company picture pre-uploaded on pick); a
 * null/absent token clears the current picture. */
export const updateCompanyProfileImageSchema = z.object({
  token: uploadTokenSchema.nullish(),
  workspaceURL: WorkspaceURLSchema,
});

export type UpdateCompanyProfileImageValues = z.infer<
  typeof updateCompanyProfileImageSchema
>;

export const directorySettingsSchema = z.object({
  companyInDirectory: z.boolean().optional(),
  companyEmail: z.boolean().optional(),
  companyPhone: z.boolean().optional(),
  companyWebsite: z.boolean().optional(),
  companyAddress: z.boolean().optional(),
  companyDescription: z.string().optional(),
  contactInDirectory: z.boolean().optional(),
  contactFunction: z.boolean().optional(),
  contactEmail: z.boolean().optional(),
  contactPhone: z.boolean().optional(),
  contactLinkedin: z.boolean().optional(),
});

export type DirectorySettingsFormValues = z.infer<
  typeof directorySettingsSchema
>;
