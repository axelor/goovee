import {z} from 'zod';

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
