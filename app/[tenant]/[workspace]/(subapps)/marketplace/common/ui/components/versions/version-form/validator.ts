import {z} from 'zod';
import {MARKETPLACE_VERSION_STATUS} from '../../../../constants/statuses';
import {VERSION_NUMBER_PATTERN} from '../../../../utils/version-number';

export const MAX_BUNDLE_SIZE = 20 * 1024 * 1024; // 20 MB

/** How many versions the edit dialog loads per page (initial + each fetch). */
export const VERSIONS_PAGE_SIZE = 8;

/** Prefetch the next page once this many loaded entries remain ahead of the
 *  current position, so paging stays ahead of the user without blocking. */
export const VERSIONS_PREFETCH_AHEAD = 3;

export const versionSchema = z
  .object({
    id: z.string().optional(),
    productId: z.string().min(1, 'Product is required'),
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
