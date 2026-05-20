import {z} from 'zod';
import {MARKETPLACE_TYPE} from '../../../constants/marketplace-types';
import {MARKETPLACE_VERSION_STATUS} from '../../../constants/statuses';

export const MAX_BUNDLE_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB per image
export const MAX_IMAGES = 9; // total per product (existing + new)
export const ACCEPTED_IMAGE_TYPES = /^image\/(png|jpe?g|gif|webp|svg\+xml)$/;

const optionalUrl = z
  .union([z.url({protocol: /^https?$/}), z.literal('')])
  .optional();

export const productSchema = z
  .object({
    id: z.string().optional(),
    marketplaceTypeSelect: z.enum([
      MARKETPLACE_TYPE.SKILL,
      MARKETPLACE_TYPE.APP,
    ]),
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
    salePrice: z
      .number()
      .min(0, 'Price cannot be negative')
      .max(999_999_999, 'Price is unrealistically high')
      .optional(),
    /* Ids of existing AOSProductPicture rows to keep. Anything not in
     * this list is unlinked + deleted server-side. Always send the full
     * surviving set on submit (the form initializes it from `initial`). */
    existingImageIds: z.array(z.string()),
    /* Newly picked files to upload + link as AOSProductPicture rows. */
    newImages: z
      .array(z.instanceof(File))
      .refine(arr => arr.every(f => f.size <= MAX_IMAGE_SIZE), {
        message: 'Each image must be 5 MB or less',
      })
      .refine(arr => arr.every(f => ACCEPTED_IMAGE_TYPES.test(f.type)), {
        message: 'Only PNG / JPEG / GIF / WEBP / SVG images are allowed',
      }),
  })
  .superRefine((v, ctx) => {
    const total = v.existingImageIds.length + v.newImages.length;
    if (total > MAX_IMAGES) {
      ctx.addIssue({
        code: 'custom',
        path: ['newImages'],
        message: `At most ${MAX_IMAGES} images per product (you have ${total}).`,
      });
    }
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
