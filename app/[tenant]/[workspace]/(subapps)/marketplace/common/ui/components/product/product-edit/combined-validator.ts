import {z} from 'zod';
import {uploadTokenSchema} from '@/lib/core/upload/validators';
import {MARKETPLACE_VERSION_STATUS} from '../../../../constants/statuses';
import {VERSION_NUMBER_PATTERN} from '../../../../utils/version-number';
import {productSchema} from '../product-form/validator';

/**
 * One editable version row in the combined page editor. Like the dialog's
 * `versionSchema` but (a) no `productId` — the page owns it — and (b)
 * `statusSelect` also allows `unpublished`, since the page stages status via
 * the "Mark as…" buttons rather than the dialog's separate unpublish action.
 */
export const versionRowSchema = z
  .object({
    id: z.string().optional(),
    /* The row's loaded optimistic-lock counter, round-tripped so an existing
     * version's update is checked against the value the form was loaded with —
     * a concurrent edit to it is then rejected rather than silently overwritten.
     * Absent on new rows. */
    version: z.number().optional(),
    versionNumber: z
      .string()
      .min(1, 'Version number is required')
      .max(40)
      .regex(VERSION_NUMBER_PATTERN, {
        message:
          'Use 1–3 numeric segments, optionally followed by -tag (e.g. 1.2.3-rc1)',
      }),
    changelog: z.string().max(5000).optional(),
    statusSelect: z.enum([
      MARKETPLACE_VERSION_STATUS.DRAFT,
      MARKETPLACE_VERSION_STATUS.PUBLISHED,
      MARKETPLACE_VERSION_STATUS.UNPUBLISHED,
    ]),
    compatibilitySetIds: z
      .array(z.string())
      .min(1, 'Pick at least one compatibility version'),
    /* Single-use token for a pre-staged bundle (purpose `marketplace:bundle`),
     * redeemed server-side. Absent when editing an existing version without
     * replacing its bundle. Size/type are enforced at stage time by the
     * policy. */
    bundleToken: uploadTokenSchema.optional(),
  })
  .superRefine((values, context) => {
    if (!values.id && !values.bundleToken) {
      context.addIssue({
        code: 'custom',
        path: ['bundleToken'],
        message: 'Bundle file is required for a new version',
      });
    }
  });

export type VersionRowValues = z.infer<typeof versionRowSchema>;

/**
 * The whole combined page form: the product fields (reused verbatim) plus two
 * version arrays — `versions` (loaded existing rows, edited in place) and
 * `newVersions` (rows the user added this session). Splitting them keeps RHF's
 * dirty tracking honest against paginated loading (see `useProductEditForm`).
 */
/* Destructuring the base shape is zod v4's recommended extend (best tsc
 * performance; `.merge()` is deprecated and `.extend()` is heavier here). */
export const combinedEditSchema = z.object({
  ...productSchema.shape,
  versions: z.array(versionRowSchema),
  newVersions: z.array(versionRowSchema),
});

export type CombinedEditValues = z.infer<typeof combinedEditSchema>;

/* The product fields as a self-contained block (the lock `version` plus every
 * editable column), reused by the save payload below. */
export const productEditBlockSchema = productSchema.omit({
  id: true,
  images: true,
});

export type ProductEditBlock = z.infer<typeof productEditBlockSchema>;

/**
 * What `saveProductWithVersions` actually receives. The form above always holds
 * the *whole* product (for live field validation), but the editor only *sends*
 * what changed, so here the product and images are optional:
 *
 *   - `id` present     → editing that listing (scopes ownership); absent → create.
 *   - `product` present → create, or an edit that changed a product field. The
 *     block reuses the product rules, so a present product is always complete
 *     (this is how create still carries its required defaults). Absent → a
 *     versions-only edit: the product row is left untouched.
 *   - `images` present → the full ordered screenshot list to reconcile (it's
 *     positional, so it's all-or-nothing); absent → screenshots untouched.
 *   - `versions`/`newVersions` are already upsert-only (only changed/new rows).
 */
export const savePayloadSchema = z
  .object({
    id: z.string().optional(),
    product: productEditBlockSchema.optional(),
    images: productSchema.shape.images.optional(),
    versions: z.array(versionRowSchema),
    newVersions: z.array(versionRowSchema),
  })
  .superRefine((data, context) => {
    if (!data.id && !data.product) {
      context.addIssue({
        code: 'custom',
        path: ['product'],
        message: 'Product details are required when creating a listing',
      });
    }
  });

export type SavePayload = z.infer<typeof savePayloadSchema>;
