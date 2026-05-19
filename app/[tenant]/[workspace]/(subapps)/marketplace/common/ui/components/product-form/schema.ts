import {z} from 'zod';
import {MARKETPLACE_TYPE} from '../../../constants/marketplace-types';
import {MARKETPLACE_VERSION_STATUS} from '../../../constants/statuses';

export const MAX_BUNDLE_SIZE = 20 * 1024 * 1024; // 20 MB

const optionalUrl = z
  .union([z.url({protocol: /^https?$/}), z.literal('')])
  .optional();

export const productSchema = z.object({
  id: z.string().optional(),
  marketplaceTypeSelect: z.enum([MARKETPLACE_TYPE.SKILL, MARKETPLACE_TYPE.APP]),
  name: z.string().min(1, 'Name is required').max(120),
  description: z
    .string()
    .min(1, 'Short description is required')
    .max(280, 'Keep it under 280 characters'),
  longDescription: z.string().max(20000).optional(),
  productCategoryId: z.string().min(1, 'Category is required'),
  marketplaceCoverStyle: z.string().min(1, 'Cover is required'),
  marketplaceIconCode: z.string().min(1, 'Icon is required'),
  documentationUrl: optionalUrl,
  supportIssuesUrl: optionalUrl,
  supportContactUrl: optionalUrl,
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const versionSchema = z
  .object({
    id: z.string().optional(),
    productId: z.string().min(1, 'Product is required'),
    versionNumber: z
      .string()
      .min(1, 'Version number is required')
      .max(40)
      .regex(/^[0-9]+(\.[0-9]+){0,2}([\-+][0-9A-Za-z.\-]+)?$/, {
        message: 'Use a version like 1.0.0',
      }),
    changelog: z.string().max(5000).optional(),
    statusSelect: z.enum([
      MARKETPLACE_VERSION_STATUS.DRAFT,
      MARKETPLACE_VERSION_STATUS.PUBLISHED,
    ]),
    compatibilitySetIds: z
      .array(z.string())
      .min(1, 'Pick at least one compatibility version'),
    bundleFile: z
      .instanceof(File)
      .refine(f => f.size <= MAX_BUNDLE_SIZE, {
        message: 'Bundle must be 20 MB or less',
      })
      .optional(),
    existingBundleFileId: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.id && !v.bundleFile) {
      ctx.addIssue({
        code: 'custom',
        path: ['bundleFile'],
        message: 'Bundle file is required for a new version',
      });
    }
  });

export type VersionFormValues = z.infer<typeof versionSchema>;
