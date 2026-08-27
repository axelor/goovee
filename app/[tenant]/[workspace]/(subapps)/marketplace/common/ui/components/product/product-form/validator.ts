import {z} from 'zod';
import {uploadTokenSchema} from '@/lib/core/upload/validators';
import {COVER_STYLES} from '../../../../constants/gradients';
import {ICON_CODES} from '../../../../constants/icons';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import {MAX_IMAGES} from '../../../../constants/uploads';

const optionalUrl = z.union([z.httpUrl(), z.literal('')]).optional();

export const productSchema = z.object({
  id: z.string().optional(),
  /* Optimistic-lock token: the row version the form was loaded with. Sent
   * back on edit so a concurrent save by someone else is rejected instead
   * of silently overwritten. Absent on create. */
  version: z.number().optional(),
  marketplaceTypeSelect: z.enum([MARKETPLACE_TYPE.SKILL, MARKETPLACE_TYPE.APP]),
  /* `.trim()` precedes the length checks on both fields below, so whitespace
   * alone cannot satisfy the minimum and padding does not count towards the
   * maximum. The parse returns the trimmed value, so that is what persists. */
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: z
    .string()
    .trim()
    .min(1, 'Short description is required')
    .max(280, 'Keep it under 280 characters'),
  longDescription: z.string().max(20000).optional(),
  categoryIds: z
    .array(z.string().min(1))
    .min(1, 'At least one category is required'),
  licenseId: z.string().min(1, 'License is required'),
  coverStyle: z.enum(COVER_STYLES, 'Cover is required'),
  iconCode: z.enum(ICON_CODES, 'Icon is required'),
  documentationUrl: optionalUrl,
  supportIssuesUrl: optionalUrl,
  supportContactUrl: optionalUrl,
  salePrice: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(999_999_999, 'Price is unrealistically high')
    .optional(),
  /* Ordered list of screenshots — array index IS the persisted
   * `sequence`. Each member is either an already-saved picture (referenced by
   * its AOSMarketplaceProductPicture row id) or a newly-picked file that was
   * pre-uploaded via the stage route (referenced by its opaque single-use
   * token, redeemed server-side). Existing rows whose id is absent from this
   * array are unlinked + deleted server-side. Size/type are enforced at stage
   * time by the `marketplace:screenshot` policy. */
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
        z.object({kind: z.literal('new'), token: uploadTokenSchema}),
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
