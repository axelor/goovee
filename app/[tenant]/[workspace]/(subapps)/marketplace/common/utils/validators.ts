import {z} from 'zod';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import {MyContributionsTab, ProductTab} from '../constants/tabs';

export const PAGE_SIZE = 12;

export const searchParamsSchema = z.object({
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().positive().max(100))
    .catch(PAGE_SIZE)
    .default(PAGE_SIZE),
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().positive())
    .catch(1)
    .default(1),
  category: z.string().optional().catch(undefined),
  sort: z
    .enum(['popular', 'newest', 'rating'])
    .catch('popular')
    .default('popular'),
  priceType: z.enum(['free', 'paid', 'all']).catch('all').default('all'),
  /* Accepts any selection code; the listing page narrows it against the
   * known type list and falls back to 'all' if unknown. Keeps the schema
   * forward-compatible with new marketplace types. */
  type: z.string().catch('all').default('all'),
});

export const pageParamsSchema = z.object({
  tenant: z.string(),
  workspace: z.string(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
export type PageParams = z.infer<typeof pageParamsSchema>;

/* Product page */
export const productPageParamsSchema = z.object({
  tenant: z.string(),
  workspace: z.string(),
  slug: z.string(),
});

export const productSearchParamsSchema = z.object({
  tab: z.enum(ProductTab).catch(ProductTab.Overview),
  reviewPage: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().positive())
    .catch(1),
  versionPage: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().positive())
    .catch(1),
  /* Owner-only preview of an unpublished product. Access is enforced
   * server-side (owner filter), so the flag alone exposes nothing. */
  preview: z.enum(['1', 'true']).optional().transform(Boolean).catch(false),
});

export type ProductPageParams = z.infer<typeof productPageParamsSchema>;
export type ProductSearchParams = z.infer<typeof productSearchParamsSchema>;

/* My Contributions page */
export const myContributionsParamsSchema = z.object({
  tenant: z.string(),
  workspace: z.string(),
});

export const myContributionsSearchParamsSchema = z.object({
  tab: z.enum(MyContributionsTab).catch(MyContributionsTab.Overview),
  productsPage: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().positive())
    .catch(1),
});

export type MyContributionsParams = z.infer<typeof myContributionsParamsSchema>;
export type MyContributionsSearchParams = z.infer<
  typeof myContributionsSearchParamsSchema
>;

/* My Purchases page */
export const myPurchasesParamsSchema = z.object({
  tenant: z.string(),
  workspace: z.string(),
});

export const myPurchasesSearchParamsSchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().positive())
    .catch(1)
    .default(1),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().positive().max(100))
    .catch(10)
    .default(10),
});

export type MyPurchasesParams = z.infer<typeof myPurchasesParamsSchema>;
export type MyPurchasesSearchParams = z.infer<
  typeof myPurchasesSearchParamsSchema
>;

/* My Account hub landing — only needs the tenant/workspace route params; each
 * sub-route (purchases/contributions/favorites) owns its own search params. */
export const myAccountParamsSchema = z.object({
  tenant: z.string(),
  workspace: z.string(),
});

export type MyAccountParams = z.infer<typeof myAccountParamsSchema>;

/* My Account → Favorites: page/limit pagination + name/description search
 * over saved products. */
export const myFavoritesSearchParamsSchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().positive())
    .catch(1)
    .default(1),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().positive().max(100))
    .catch(10)
    .default(10),
  search: z
    .string()
    .transform(val => val.trim())
    .pipe(z.string().min(1))
    .optional()
    .catch(undefined),
  priceType: z.enum(['free', 'paid', 'all']).catch('all').default('all'),
  /* Narrowed to the known marketplace types (or 'all'); anything else falls
   * back to 'all'. */
  type: z
    .union([z.enum(MARKETPLACE_TYPE), z.literal('all')])
    .catch('all')
    .default('all'),
});

export type MyFavoritesSearchParams = z.infer<
  typeof myFavoritesSearchParamsSchema
>;

/* Checkout success page. `orderId` is the marketplace order created at this checkout; the page
 * re-reads that order's lines (partner-scoped, so a tampered id can't surface someone else's
 * order) and shows them as the confirmation. */
export const checkoutSuccessSearchParamsSchema = z.object({
  orderId: z.string().trim().min(1).optional(),
});

export type CheckoutSuccessSearchParams = z.infer<
  typeof checkoutSuccessSearchParamsSchema
>;
