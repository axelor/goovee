import {SUBAPP_CODES} from '@/constants';
import {t, tattr} from '@/locale/server';
import type {OverlayColor} from '@/types';
import {Hero} from '../hero';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/pagination';
import {cn} from '@/utils/css';
import {workspacePathname} from '@/utils/workspace';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {getLoginURL} from '@/utils/url';

import {ProductCard} from '../common/ui/components/product-card';
import {ProductSortSelect} from '../common/ui/components/product-sort-select';
import {
  findProducts,
  findProductCategories,
  type ListProduct,
  type ListCategory,
} from '../common/orm/orm';
import {ensureAuth} from '../common/utils/auth-helper';
import {MARKETPLACE_TYPE} from '../common/constants/marketplace-types';
import {MARKETPLACE_TYPE_BY_SEGMENT} from '../common/constants/route-types';
import {and} from '@/utils/orm';
import type {AOSProduct} from '@/goovee/.generated/models';
import type {OrderByOptions} from '@goovee/orm';
import {
  searchParamsSchema,
  pageParamsSchema,
  PAGE_SIZE,
  type SearchParams,
} from '../common/utils/validators';
import {
  getPaginationButtons,
  getSkip,
  getPages,
  getTotal,
} from '@/utils/pagination';

export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [rawParams, rawSearchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const paramsResult = pageParamsSchema.safeParse(rawParams);
  if (!paramsResult.success) notFound();
  const params = paramsResult.data;

  const searchParamsResult = searchParamsSchema.safeParse(rawSearchParams);
  if (!searchParamsResult.success) notFound();
  const searchParams = searchParamsResult.data;

  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);

  const segment = params.type;
  const marketplaceType = MARKETPLACE_TYPE_BY_SEGMENT[segment];
  if (!marketplaceType) notFound();

  const listingHref = `${workspaceURI}/${SUBAPP_CODES.marketplace}/${segment}`;

  const {error, auth, forceLogin} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: true,
  });
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: listingHref,
        workspaceURI,
        tenant: tenantId,
      }),
    );
  }
  if (error) notFound();

  const {limit, page, category, sort} = searchParams;
  const client = auth.tenant.client;

  const buildQuery = (overrides: Partial<SearchParams> = {}) => {
    const query: Record<string, string> = {};
    if (limit !== PAGE_SIZE) query.limit = String(limit);
    if (page !== 1) query.page = String(page);
    if (category) query.category = category;
    if (sort !== 'popular') query.sort = sort;
    for (const [k, v] of Object.entries(overrides)) {
      if (v !== undefined) query[k] = String(v);
    }
    return query;
  };

  // Fetch categories
  const categories = await findProductCategories({
    client,
    workspace: auth.workspace,
    take: 100,
  });

  const getOrderBy = (
    sortValue: 'popular' | 'newest' | 'rating',
  ): OrderByOptions<AOSProduct> => {
    switch (sortValue) {
      case 'newest':
        return {createdOn: 'DESC'};
      case 'rating':
        return {averageRating: 'DESC'};
      case 'popular':
        return {installCount: 'DESC'};
    }
  };

  // Fetch products with pagination and filtering
  const products = await findProducts({
    client,
    workspace: auth.workspace,
    take: limit,
    skip: getSkip(limit, page),
    where: and<AOSProduct>([
      {marketplaceTypeSelect: marketplaceType},
      category
        ? {productCategory: {id: category, forMarketPlace: true}}
        : undefined,
    ]),
    orderBy: getOrderBy(sort),
  });

  const totalCount = getTotal(products);
  const totalPages = getPages(products, limit);

  const categoryNames = await Promise.all(
    categories.map((cat: ListCategory) => tattr(cat.name ?? '')),
  );

  return (
    <>
      <Hero
        title={
          auth.workspace.config.marketplaceHeroTitle ||
          (marketplaceType === MARKETPLACE_TYPE.APP
            ? await t('Apps Studio')
            : await t('Skills Hub'))
        }
        description={
          auth.workspace.config.marketplaceHeroDescription ||
          (marketplaceType === MARKETPLACE_TYPE.APP
            ? await t(
                'Discover and install ready-made apps to extend your Axelor portal.',
              )
            : await t(
                'Open-source plugins to extend Axelor — code generation, workflow automation, AI agents. Free forever.',
              ))
        }
        background={
          (auth.workspace.config
            .marketplaceHeroOverlayColorSelect as OverlayColor | null) ?? null
        }
        image={
          auth.workspace.config.marketplaceHeroBgImage?.id
            ? `${workspaceURI}/${SUBAPP_CODES.marketplace}/api/hero/background`
            : null
        }
        type={marketplaceType}
      />

      <div className="container py-8 space-y-6">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 items-start">
          <Link
            href={{
              pathname: listingHref,
              query: buildQuery({category: undefined}),
            }}
            scroll={false}
            replace
            prefetch={false}>
            <button
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                !category
                  ? 'bg-foreground text-background'
                  : 'bg-background text-foreground border border-border hover:border-foreground',
              )}>
              {await t('All')}
            </button>
          </Link>

          {categories.map((cat: ListCategory, idx: number) => (
            <Link
              key={cat.id}
              href={{
                pathname: listingHref,
                query: buildQuery({category: cat.id}),
              }}
              scroll={false}
              replace
              prefetch={false}>
              <button
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  category === cat.id
                    ? 'bg-foreground text-background'
                    : 'bg-background text-foreground border border-border hover:border-foreground',
                )}>
                {categoryNames[idx]}
              </button>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-muted-foreground">
            {totalCount === 1
              ? await t('1 result')
              : await t('{0} results', String(totalCount))}
          </div>
          <ProductSortSelect currentSort={sort || 'popular'} />
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {products.map((product: ListProduct) => (
              <ProductCard
                key={product.id}
                product={product}
                workspaceURI={workspaceURI}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              {await t('No products found')}
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination className="!mb-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious asChild>
                  <Link
                    scroll={false}
                    className={cn({['invisible']: page <= 1})}
                    replace
                    prefetch={false}
                    href={{
                      pathname: listingHref,
                      query: buildQuery({page: page - 1}),
                    }}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">{await t('Previous')}</span>
                  </Link>
                </PaginationPrevious>
              </PaginationItem>
              {getPaginationButtons({
                currentPage: +page,
                totalPages: totalPages,
              }).map((value, i) => {
                if (typeof value == 'string') {
                  return (
                    <PaginationItem key={i}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return (
                  <PaginationItem key={value}>
                    <PaginationLink isActive={page === value} asChild>
                      <Link
                        scroll={false}
                        replace
                        prefetch={false}
                        href={{
                          pathname: listingHref,
                          query: buildQuery({page: value}),
                        }}>
                        {value}
                      </Link>
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext asChild>
                  <Link
                    scroll={false}
                    replace
                    prefetch={false}
                    className={cn({['invisible']: page >= totalPages})}
                    href={{
                      pathname: listingHref,
                      query: buildQuery({page: page + 1}),
                    }}>
                    <span className="sr-only">{await t('Next')}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  );
}
