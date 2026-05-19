import {IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {HeroSearch} from '@/ui/components';
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
import {MARKETPLACE_TYPE} from '../common/constant/marketplace-types';
import {
  MARKETPLACE_TYPE_BY_SEGMENT,
  MARKETPLACE_TYPE_SEGMENT,
} from '../common/constant/route-types';
import {and} from '@/utils/orm';
import type {AOSProduct} from '@/goovee/.generated/models';
import {
  getPaginationButtons,
  getSkip,
  getPages,
  getTotal,
} from '@/utils/pagination';

const PAGE_SIZE = 12;

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; type: string}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);

  const segment = params.type as MARKETPLACE_TYPE_SEGMENT;
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

  const {limit = PAGE_SIZE, page = 1, category, sort} = searchParams;
  const client = auth.tenant.client;

  // Fetch categories
  const categories = await findProductCategories({
    client,
    workspace: auth.workspace,
    take: 100,
  });

  // Fetch products with pagination and filtering
  const products = await findProducts({
    client,
    workspace: auth.workspace,
    take: +limit,
    skip: getSkip(limit, page),
    where: and<AOSProduct>([
      {marketplaceTypeSelect: marketplaceType},
      category
        ? {productCategory: {id: category, forMarketPlace: true}}
        : undefined,
    ]),
  });

  const totalCount = getTotal(products);
  const totalPages = getPages(products, limit);

  return (
    <>
      <HeroSearch
        title={
          marketplaceType === MARKETPLACE_TYPE.APP
            ? await t('Apps Studio')
            : await t('Skills Hub')
        }
        description={
          marketplaceType === MARKETPLACE_TYPE.APP
            ? await t(
                'Discover and install ready-made apps to extend your Axelor portal.',
              )
            : await t(
                'Open-source plugins to extend Axelor — code generation, workflow automation, AI agents. Free forever.',
              )
        }
        image={IMAGE_URL}
      />

      <div className="container py-8 space-y-6">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 items-start">
          <Link
            href={{pathname: listingHref, query: {limit, sort}}}
            scroll={false}
            replace>
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

          {categories.map((cat: ListCategory) => (
            <Link
              key={cat.id}
              href={{
                pathname: listingHref,
                query: {limit, category: cat.id, sort},
              }}
              scroll={false}
              replace>
              <button
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  category === cat.id
                    ? 'bg-foreground text-background'
                    : 'bg-background text-foreground border border-border hover:border-foreground',
                )}>
                {cat.name}
              </button>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-muted-foreground">
            {totalCount}{' '}
            {totalCount === 1 ? await t('result') : await t('results')}
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
                    className={cn({['invisible']: +page <= 1})}
                    replace
                    href={{
                      pathname: listingHref,
                      query: {...searchParams, page: +page - 1},
                    }}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous</span>
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
                    <PaginationLink isActive={+page === value} asChild>
                      <Link
                        scroll={false}
                        replace
                        href={{
                          pathname: listingHref,
                          query: {...searchParams, page: String(value)},
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
                    className={cn({['invisible']: +page >= totalPages})}
                    href={{
                      pathname: listingHref,
                      query: {...searchParams, page: +page + 1},
                    }}>
                    <span className="sr-only">Next</span>
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
