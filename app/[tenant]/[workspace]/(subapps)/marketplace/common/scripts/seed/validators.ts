import {z} from 'zod';

/* Source of truth for the marketplace seed payload. Runtime validation
 * uses these Zod schemas; the matching `seed.schema.json` is a hand-
 * derived JSON Schema purely for editor / IDE support inside `seed.json`.
 * If you change a Zod schema here, update the JSON Schema too. */

export const CategorySchema = z
  .object({
    code: z
      .string()
      .regex(
        /^[A-Z][A-Z0-9-]+$/,
        'Uppercase letters, digits, dashes; must start with a letter.',
      ),
    name: z.string().min(1),
    iconCode: z.string().optional(),
    colorTheme: z.string().optional(),
  })
  .strict();
export type CategorySeed = z.infer<typeof CategorySchema>;

export const CompatibilityVersionSchema = z
  .object({
    name: z
      .string()
      .regex(
        /^v\d+\.\d+\.\d+$/,
        "Expected 'vMAJOR.MINOR.PATCH', e.g. 'v9.0.9'.",
      ),
    title: z.string().min(1),
    releasedOn: z.iso.datetime().optional(),
  })
  .strict();
export type CompatibilityVersionSeed = z.infer<
  typeof CompatibilityVersionSchema
>;

export const LicenseSchema = z
  .object({
    code: z
      .string()
      .regex(
        /^[A-Za-z][A-Za-z0-9._-]*$/,
        'Letters, digits, dot, dash, underscore; must start with a letter. Use the SPDX identifier when available.',
      ),
    name: z.string().min(1),
    url: z.httpUrl().optional(),
    description: z.string().optional(),
    isPaid: z.boolean().optional(),
    sequence: z.number().int().min(0).optional(),
  })
  .strict();
export type LicenseSeed = z.infer<typeof LicenseSchema>;

export const VersionSchema = z
  .object({
    versionNumber: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/, "Expected semver 'MAJOR.MINOR.PATCH'."),
    changelog: z.string().optional(),
    status: z.enum(['draft', 'published']),
    /* Dates are optional at the schema level but cross-validated by the
     * seeder: required+ordered for `published`, absent for `draft`. See
     * AUTHORING.md → "Date and version ordering". */
    submittedAt: z.iso.datetime().optional(),
    releasedAt: z.iso.datetime().optional(),
    compatibilityVersions: z.array(z.string()).optional(),
  })
  .strict();
export type VersionSeed = z.infer<typeof VersionSchema>;

export const ReviewSchema = z
  .object({
    authorEmail: z.email(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    reviewedVersionNumber: z
      .string()
      .optional()
      .describe('Defaults to the latest published version of the product.'),
  })
  .strict();
export type ReviewSeed = z.infer<typeof ReviewSchema>;

export const ProductSchema = z
  .object({
    code: z
      .string()
      .regex(
        /^mkt-demo-[a-z0-9-]+$/,
        "Must start with 'mkt-demo-' so reset can target seeded products only.",
      ),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    supplierEmail: z
      .email()
      .optional()
      .describe('Override the CLI --supplier default for this product.'),
    description: z.string().max(280).optional(),
    longDescription: z.string().optional(),
    type: z.enum(['skill', 'app']),
    coverStyle: z.string().regex(/^gradient-(10|[1-9])$/),
    categoryCode: z.string(),
    price: z
      .number()
      .min(0)
      .describe('In the workspace default sale currency. 0 = free.'),
    installCount: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe(
        'Demo-only fake install count to make the listing look realistic. Runtime downloads still increment this normally.',
      ),
    documentationUrl: z.httpUrl().optional(),
    supportIssuesUrl: z.httpUrl().optional(),
    supportContactUrl: z.httpUrl().optional(),
    versions: z.array(VersionSchema).min(1),
    reviews: z.array(ReviewSchema).optional(),
  })
  .strict();
export type ProductSeed = z.infer<typeof ProductSchema>;

export const SeedSchema = z
  .object({
    /* IDE-only pointer to the JSON Schema for editor autocomplete; the
     * Zod runtime ignores it but `.strict()` would otherwise reject it. */
    $schema: z.string().optional(),
    categories: z.array(CategorySchema).optional(),
    compatibilityVersions: z.array(CompatibilityVersionSchema).optional(),
    licenses: z.array(LicenseSchema).optional(),
    products: z.array(ProductSchema),
  })
  .strict();
export type SeedData = z.infer<typeof SeedSchema>;
