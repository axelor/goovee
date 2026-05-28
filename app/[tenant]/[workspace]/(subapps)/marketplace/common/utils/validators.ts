import {z} from 'zod';
import {MARKETPLACE_TYPE_SEGMENT} from '../constants/route-types';
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
});

export const pageParamsSchema = z.object({
  tenant: z.string(),
  workspace: z.string(),
  type: z.enum(MARKETPLACE_TYPE_SEGMENT),
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
  skillsPage: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().positive())
    .catch(1),
  appsPage: z
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

/* Checkout success page. `id` carries the purchase-row ids from this
 * checkout — repeated query keys (?id=1&id=2) arrive as an array, a single
 * one as a string; normalize both to a clean string[]. */
export const checkoutSuccessSearchParamsSchema = z.object({
  id: z
    .union([z.string(), z.array(z.string())])
    .transform(val => (Array.isArray(val) ? val : [val]).filter(Boolean))
    .catch([])
    .default([]),
});

export type CheckoutSuccessSearchParams = z.infer<
  typeof checkoutSuccessSearchParamsSchema
>;
