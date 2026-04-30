import {z} from 'zod';

export const VersionSchema = z.object({
  _key: z.string(),
  version: z.string().trim().min(1, 'Version string is required'),
  releaseNotes: z.string().optional(),
  releaseDate: z.string().optional(),
  isLatest: z.boolean(),
  file: z.instanceof(File).nullable(),
  fileName: z.string(),
});

export const SellerProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  isFree: z.boolean(),
  salePrice: z.number().min(0).optional(),
  categoryIds: z.array(z.string()).min(1, 'Select at least one category'),
  versions: z.array(VersionSchema).min(1, 'Add at least one version'),
  marketplaceStatusSelect: z.enum(['draft', 'submitted']),
});

export type SellerProductFormData = z.infer<typeof SellerProductSchema>;
