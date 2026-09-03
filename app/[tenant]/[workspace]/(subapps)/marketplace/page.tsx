import {SUBAPP_CODES} from '@/constants';
import type {AOSMarketplaceProduct} from '@/goovee/.generated/models';
import {t, tattr} from '@/locale/server';
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

import {getPartnerId} from '@/utils';
import type {OrderByOptions} from '@goovee/orm';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Link} from '@/ui/components/link';
import {notFound} from 'next/navigation';
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
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {getMarketplaceConfig} from './common/orm/config';
import {
  PAGE_SIZE,
  pageParamsSchema,
  searchParamsSchema,
  type SearchParams,
} from './common/utils/validators';
import Search from './search';

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

  const searchParamsResult = searchParamsSchema.safeParse(rawSearchParams);
  if (!searchParamsResult.success) notFound();
  const searchParams = searchParamsResult.data;
  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
    allowGuest: true,
  });
  if (!access.ok) return denyPage(access);

  const listingHref = access.scope.forRouter(`/${SUBAPP_CODES.marketplace}`);

  const {limit, page, category, sort, priceType, type: rawType} = searchParams;
  const client = access.tenant.client;
  const config = await getMarketplaceConfig(access.workspace.config.id, client);
  if (!config) notFound();
  const partnerId = access.user ? getPartnerId(access.user) : undefined;

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
    workspace: access.workspace,
    config,
    mainPartnerId: partnerId,
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

  /* No match in the loaded list — unknown, archived, or past the 100 fetched —
   * leaves the title on the "all" heading, though the product query still
   * filters by the id. */
  const activeCategoryIndex = category
    ? categories.findIndex(
        (listCategory: ListCategory) => listCategory.id === category,
      )
    : -1;
  const activeCategoryName =
    activeCategoryIndex === -1 ? null : categoryNames[activeCategoryIndex];

  return (
    <>
      {/* Grid so the refine controls can sit beside the title on desktop, where
          that row is otherwise empty, and drop below the search box on a
          phone. Note the search box comes second in the DOM but renders below
          the controls on desktop, so tab order and visual order differ
          there. */}
      <div className="container pt-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] lg:items-end gap-x-4">
        <div className="lg:col-start-1 lg:row-start-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-royal">
            {await t('Marketplace')}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2.5 flex-wrap">
            <h1 className="text-[26px] font-extrabold tracking-[-0.025em] text-ink-900">
              {activeCategoryName ?? (await t('All extensions'))}
            </h1>
            <p className="text-sm text-ink-500">
              {totalCount === 1
                ? await t('1 extension available')
                : await t('{0} extensions available', String(totalCount))}
            </p>
          </div>
        </div>

        {/* Full-width search: the catalogue's primary way in, so it gets the
            whole measure rather than a corner of the header. */}
        <Search className="mt-6 w-full lg:col-span-2 lg:row-start-2" />

        <div className="mt-4 lg:mt-0 lg:col-start-2 lg:row-start-1 flex flex-wrap gap-3 lg:justify-end">
          <ProductTypeSelect currentType={type} types={typeOptions} />
          <PriceTypeSelect currentPriceType={priceType} />
          <ProductSortSelect currentSort={sort || 'popular'} />
        </div>
      </div>

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
                  ? 'border border-royal bg-royal text-white'
                  : 'bg-ink-25 text-ink-900 border border-ink-100 hover:border-royal',
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
                    ? 'border border-royal bg-royal text-white'
                    : 'bg-ink-25 text-ink-900 border border-ink-100 hover:border-royal',
                )}>
                {categoryNames[idx]}
              </button>
            </Link>
          ))}
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {products.map((product: ListProduct) => (
              <ProductCard
                key={product.id}
                product={product}
                scope={access.scope}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-ink-500">
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
