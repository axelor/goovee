import {SUBAPP_CODES} from '@/constants';
import type {AOSMarketplaceProduct} from '@/goovee/.generated/models';
import {t, tattr} from '@/locale/server';
import type {OverlayColor} from '@/types';
import type {NullableValues} from '@/types/util';
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
import {and} from '@/utils/orm';
import {
  getPages,
  getPaginationButtons,
  getSkip,
  getTotal,
} from '@/utils/pagination';
import {getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import type {OrderByOptions} from '@goovee/orm';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Link} from '@/ui/components/link';
import {notFound, redirect} from 'next/navigation';
import {MARKETPLACE_TYPE} from './common/constants/marketplace-types';
import {
  findProductCategories,
  findProducts,
  type ListCategory,
  type ListProduct,
} from './common/orm';
import {ProductCard} from './common/ui/components/product/product-card';
import {PriceTypeSelect} from './common/ui/components/product/price-type-select';
import {ProductSortSelect} from './common/ui/components/product/product-sort-select';
import {ProductTypeSelect} from './common/ui/components/product/product-type-select';
import {ensureAuth} from './common/utils/auth-helper';
import {
  PAGE_SIZE,
  pageParamsSchema,
  searchParamsSchema,
  type SearchParams,
} from './common/utils/validators';
import {Hero} from './hero';

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

  const listingHref = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;

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

  const {limit, page, category, sort, priceType, type: rawType} = searchParams;
  const client = auth.tenant.client;

  // Known type codes from the selection enum. Validate the URL value
  // against this set so an unknown code falls back to 'all'.
  const knownTypes = Object.values(MARKETPLACE_TYPE) as string[];
  const type =
    rawType === 'all' || knownTypes.includes(rawType) ? rawType : 'all';

  const typeOptions = await Promise.all(
    knownTypes.map(async value => ({value, label: await tattr(value)})),
  );

  const buildQuery = (
    overrides: Partial<NullableValues<SearchParams>> = {},
  ) => {
    const query: Record<string, string> = {};
    if (limit !== PAGE_SIZE) query.limit = String(limit);
    if (page !== 1) query.page = String(page);
    if (category) query.category = category;
    if (sort !== 'popular') query.sort = sort;
    if (priceType !== 'all') query.priceType = priceType;
    if (type !== 'all') query.type = type;
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) {
        delete query[k];
      } else if (v !== undefined) {
        query[k] = String(v);
      }
    }
    return query;
  };

  const categories = await findProductCategories({
    client,
    take: 100,
    orderBy: {sequence: 'ASC'},
  });

  const getOrderBy = (
    sortValue: 'popular' | 'newest' | 'rating',
  ): OrderByOptions<AOSMarketplaceProduct> => {
    switch (sortValue) {
      case 'newest':
        return {createdOn: 'DESC'};
      case 'rating':
        return {averageRating: 'DESC'};
      case 'popular':
        return {installCount: 'DESC'};
    }
  };

  const priceFilter =
    priceType === 'free'
      ? {salePrice: 0}
      : priceType === 'paid'
        ? {salePrice: {gt: 0}}
        : undefined;

  const products = await findProducts({
    client,
    workspace: auth.workspace,
    mainPartnerId: auth.user?.mainPartnerId,
    take: limit,
    skip: getSkip(limit, page),
    where: and<AOSMarketplaceProduct>([
      type !== 'all' && {marketplaceTypeSelect: type as MARKETPLACE_TYPE},
      category && {categorySet: {id: category}},
      priceFilter,
    ]),
    orderBy: getOrderBy(sort),
  });

  const totalCount = getTotal(products);
  const totalPages = getPages(products, limit);

  const categoryNames = await Promise.all(
    categories.map((cat: ListCategory) => tattr(cat.name)),
  );

  return (
    <>
      <Hero
        title={
          auth.workspace.config.marketplaceHeroTitle || (await t('Marketplace'))
        }
        description={
          auth.workspace.config.marketplaceHeroDescription ||
          (await t(
            'Discover and install apps and skills to extend your portal.',
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
      />

      <div className="container py-8 space-y-6">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 items-start">
          <Link
            href={{
              pathname: listingHref,
              query: buildQuery({category: null, page: null}),
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
                query: buildQuery({category: cat.id, page: null}),
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
          <div className="flex gap-3">
            <ProductTypeSelect currentType={type} types={typeOptions} />
            <PriceTypeSelect currentPriceType={priceType} />
            <ProductSortSelect currentSort={sort || 'popular'} />
          </div>
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
