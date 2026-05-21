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
