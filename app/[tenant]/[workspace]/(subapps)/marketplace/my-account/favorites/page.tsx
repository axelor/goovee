import {SUBAPP_CODES} from '@/constants';
import {t, tattr} from '@/locale/server';
import type {NullableValues} from '@/types/util';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components/breadcrumb';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/pagination';
import {clone} from '@/utils';
import {cn} from '@/utils/css';
import {getPages, getPaginationButtons, getSkip} from '@/utils/pagination';
import {getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {MARKETPLACE_TYPE} from '../../common/constants/marketplace-types';
import {findFavoriteProducts} from '../../common/orm';
import {PriceTypeSelect} from '../../common/ui/components/inputs/price-type-select';
import {ProductTypeSelect} from '../../common/ui/components/inputs/product-type-select';
import {MyFavoritesTable} from '../../common/ui/components/tables/my-favorites-table';
import {ensureAuth} from '../../common/utils/auth-helper';
import {FavoritesSearch} from './search';
import {
  myAccountParamsSchema,
  myFavoritesSearchParamsSchema,
  type MyFavoritesSearchParams,
} from '../../common/utils/validators';

export default async function FavoritesPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    type?: string;
    priceType?: string;
  }>;
}) {
  const [rawParams, rawSearchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const paramsResult = myAccountParamsSchema.safeParse(rawParams);
  if (!paramsResult.success) notFound();
  const params = paramsResult.data;

  const searchParamsResult =
    myFavoritesSearchParamsSchema.safeParse(rawSearchParams);
  if (!searchParamsResult.success) notFound();
  const {page, limit, search, priceType, type} = searchParamsResult.data;

  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);

  const {error, auth, forceLogin} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: false,
  });
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-account/favorites`,
        workspaceURI,
        tenant: tenantId,
      }),
    );
  }
  if (error) notFound();

  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;
  const favoritesHref = `${marketplaceBase}/my-account/favorites`;

  const products = await findFavoriteProducts({
    client: auth.tenant.client,
    workspace: auth.workspace,
    userId: auth.user.id,
    mainPartnerId: auth.user.mainPartnerId,
    search,
    type,
    priceType,
    take: limit,
    skip: getSkip(limit, page),
  });

  // @ts-expect-error: goovee adds `_count` to nested rows, but types are wrong
  const totalPages = getPages(products, limit);
  const filtered = Boolean(search) || type !== 'all' || priceType !== 'all';

  const typeOptions = await Promise.all(
    Object.values(MARKETPLACE_TYPE).map(async value => ({
      value,
      label: await tattr(value),
    })),
  );

  const buildQuery = (
    overrides: Partial<NullableValues<MyFavoritesSearchParams>> = {},
  ) => {
    const query: Record<string, string> = {};
    if (limit !== 10) query.limit = String(limit);
    if (page !== 1) query.page = String(page);
    if (search) query.search = search;
    if (type !== 'all') query.type = type;
    if (priceType !== 'all') query.priceType = priceType;
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) {
        delete query[k];
      } else if (v !== undefined) {
        query[k] = String(v);
      }
    }
    return query;
  };

  const [marketplaceLabel, myAccountLabel, favoritesLabel, favoritesDescLabel] =
    await Promise.all([
      t('Marketplace'),
      t('My account'),
      t('Favorites'),
      t('Your saved products.'),
    ]);

  return (
    <div className="min-h-screen container pb-6">
      {/* Breadcrumb */}
      <div className="mt-6 mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-foreground-muted cursor-pointer truncate text-md">
                <Link href={marketplaceBase}>{marketplaceLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-foreground-muted cursor-pointer truncate text-md">
                <Link href={`${marketplaceBase}/my-account`}>
                  {myAccountLabel}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="sm:truncate text-lg font-semibold">
                {favoritesLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {favoritesLabel}
          </h1>
          <p className="text-muted-foreground text-sm">{favoritesDescLabel}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <FavoritesSearch className="sm:max-w-xs" />
        <div className="flex flex-wrap gap-3">
          <ProductTypeSelect currentType={type} types={typeOptions} />
          <PriceTypeSelect currentPriceType={priceType} />
        </div>
      </div>

      <MyFavoritesTable
        favorites={clone(products)}
        workspaceURI={workspaceURI}
        workspaceURL={workspaceURL}
        marketplaceBase={marketplaceBase}
        filtered={filtered}
      />

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious asChild>
                <Link
                  scroll={false}
                  replace
                  className={cn({['invisible']: page <= 1})}
                  href={{
                    pathname: favoritesHref,
                    query: buildQuery({page: page - 1}),
                  }}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">{await t('Previous')}</span>
                </Link>
              </PaginationPrevious>
            </PaginationItem>
            {getPaginationButtons({currentPage: page, totalPages}).map(
              (value, i) => {
                if (typeof value === 'string') {
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
                        href={{
                          pathname: favoritesHref,
                          query: buildQuery({page: value}),
                        }}>
                        {value}
                      </Link>
                    </PaginationLink>
                  </PaginationItem>
                );
              },
            )}
            <PaginationItem>
              <PaginationNext asChild>
                <Link
                  scroll={false}
                  replace
                  className={cn({['invisible']: page >= totalPages})}
                  href={{
                    pathname: favoritesHref,
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
  );
}
