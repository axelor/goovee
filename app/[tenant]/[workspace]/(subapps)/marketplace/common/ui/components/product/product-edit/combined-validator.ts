import {z} from 'zod';
import {MARKETPLACE_VERSION_STATUS} from '../../../../constants/statuses';
import {VERSION_NUMBER_PATTERN} from '../../../../utils/version-number';
import {productSchema} from '../product-form/validator';
import {MAX_BUNDLE_SIZE} from '../../versions/version-form/validator';

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
    bundleFile: z
      .instanceof(File)
      .refine(file => file.size <= MAX_BUNDLE_SIZE, {
        message: 'Bundle must be 20 MB or less',
      })
      .optional(),
  })
  .superRefine((values, context) => {
    if (!values.id && !values.bundleFile) {
      context.addIssue({
        code: 'custom',
        path: ['bundleFile'],
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
