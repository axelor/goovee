import {z} from 'zod';
import {COVER_STYLES} from '../../../../constants/gradients';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';

export const MAX_BUNDLE_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB per image
export const MAX_IMAGES = 9; // total per product (existing + new)
/* Common raster formats only. SVG is intentionally excluded: it can carry
 * embedded scripts/external refs, so serving user-supplied SVG is an XSS
 * vector. Used for both the schema refine and the <input accept> attribute. */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;
export const ACCEPTED_IMAGE_MESSAGE =
  'Only JPEG, PNG, WebP, GIF, or AVIF images are allowed';

const optionalUrl = z.union([z.httpUrl(), z.literal('')]).optional();

export const productSchema = z.object({
  id: z.string().optional(),
  /* Optimistic-lock token: the row version the form was loaded with. Sent
   * back on edit so a concurrent save by someone else is rejected instead
   * of silently overwritten. Absent on create. */
  version: z.number().optional(),
  marketplaceTypeSelect: z.enum([MARKETPLACE_TYPE.SKILL, MARKETPLACE_TYPE.APP]),
  name: z.string().min(1, 'Name is required').max(120),
  description: z
    .string()
    .min(1, 'Short description is required')
    .max(280, 'Keep it under 280 characters'),
  longDescription: z.string().max(20000).optional(),
  categoryIds: z
    .array(z.string().min(1))
    .min(1, 'At least one category is required'),
  licenseId: z.string().min(1, 'License is required'),
  coverStyle: z.enum(COVER_STYLES, 'Cover is required'),
  iconCode: z.string().min(1, 'Icon is required'),
  documentationUrl: optionalUrl,
  supportIssuesUrl: optionalUrl,
  supportContactUrl: optionalUrl,
  salePrice: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(999_999_999, 'Price is unrealistically high')
    .optional(),
  /* Ordered list of screenshots — array index IS the persisted
   * `sequence`. Each member is either an already-saved picture
   * (referenced by its AOSMarketplaceProductPicture row id) or a
   * newly-picked File to upload. Existing rows whose id is absent from
   * this array are unlinked + deleted server-side. The File rides
   * through FormData nested in the array — `packIntoFormData` swaps it
   * for a placeholder + blob transparently. */
  images: z
    .array(
      z.discriminatedUnion('kind', [
        z.object({
          kind: z.literal('existing'),
          id: z.string().min(1),
          /* The row's loaded version — sent back so re-sequencing an
           * existing picture is optimistic-locked against concurrent edits. */
          version: z.number(),
        }),
        z
          .object({kind: z.literal('new'), file: z.instanceof(File)})
          .refine(({file}) => file.size <= MAX_IMAGE_SIZE, {
            message: 'Each image must be 5 MB or less',
          })
          .refine(
            ({file}) =>
              (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type),
            {message: ACCEPTED_IMAGE_MESSAGE},
          ),
      ]),
    )
    .refine(arr => arr.length <= MAX_IMAGES, {
      message: `At most ${MAX_IMAGES} images per product.`,
    }),
});

export type ProductFormValues = z.infer<typeof productSchema>;

/* One ordered screenshot: either an already-saved picture (by row id) or a
 * freshly-picked file. Array position is the persisted `sequence`. */
export type ProductImage = ProductFormValues['images'][number];
