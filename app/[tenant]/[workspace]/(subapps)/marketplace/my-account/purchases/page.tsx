import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import type {NullableValues} from '@/types/util';
import {Button} from '@/ui/components';
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
import {getPartnerId} from '@/utils';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Link} from '@/ui/components/link';
import {notFound} from 'next/navigation';
import {findPurchases} from '../../common/orm';
import {MyPurchasesTable} from '../../common/ui/components/purchases/my-purchases-table';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {
  myPurchasesParamsSchema,
  myPurchasesSearchParamsSchema,
  type MyPurchasesSearchParams,
} from '../../common/utils/validators';

export default async function MyPurchasesPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{page?: string; limit?: string}>;
}) {
  const [rawParams, rawSearchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const paramsResult = myPurchasesParamsSchema.safeParse(rawParams);
  if (!paramsResult.success) notFound();

  const searchParamsResult =
    myPurchasesSearchParamsSchema.safeParse(rawSearchParams);
  if (!searchParamsResult.success) notFound();
  const searchParams = searchParamsResult.data;
  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
  });
  if (!access.ok) return denyPage(access);

  const {limit, page} = searchParams;

  const buildQuery = (
    overrides: Partial<NullableValues<MyPurchasesSearchParams>> = {},
  ) => {
    const query: Record<string, string> = {};
    if (limit !== 10) query.limit = String(limit);
    if (page !== 1) query.page = String(page);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) {
        delete query[k];
      } else if (v !== undefined) {
        query[k] = String(v);
      }
    }
    return query;
  };

  const purchases = await findPurchases({
    client: access.tenant.client,
    workspaceId: access.workspace.id,
    mainPartnerId: getPartnerId(access.user),
    take: limit,
    skip: getSkip(limit, page),
  });

  const totalPages = getPages(purchases, limit);

  const marketplaceBase = access.scope.forRouter(
    `/${SUBAPP_CODES.marketplace}`,
  );
  const purchasesHref = `${marketplaceBase}/my-account/purchases`;

  return (
    <div className="min-h-screen container pb-6">
      {/* Breadcrumb */}
      <div className="mt-6 mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-ink-500 cursor-pointer truncate">
                <Link href={marketplaceBase}>{await t('Marketplace')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-ink-500 cursor-pointer truncate">
                <Link href={`${marketplaceBase}/my-account`}>
                  {await t('My account')}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="sm:truncate text-lg font-semibold">
                {await t('My purchases')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">
            {await t('My purchases')}
          </h1>
          <p className="text-ink-500 text-sm">
            {await t(
              "Review and manage the apps you've purchased from the marketplace.",
            )}
          </p>
        </div>
      </div>

      {purchases.length === 0 ? (
        <div className="rounded-lg border border-ink-100 bg-white p-8 text-center">
          <p className="text-ink-500 mb-4">
            {await t("You haven't purchased anything yet.")}
          </p>
          <Button variant="royal" asChild>
            <Link href={marketplaceBase}>{await t('Browse marketplace')}</Link>
          </Button>
        </div>
      ) : (
        <>
          <MyPurchasesTable purchases={clone(purchases)} />

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
                        pathname: purchasesHref,
                        query: buildQuery({page: page - 1}),
                      }}>
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">{await t('Previous')}</span>
                    </Link>
                  </PaginationPrevious>
                </PaginationItem>
                {getPaginationButtons({
                  currentPage: page,
                  totalPages,
                }).map((value, i) => {
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
                            pathname: purchasesHref,
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
                      className={cn({['invisible']: page >= totalPages})}
                      href={{
                        pathname: purchasesHref,
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
        </>
      )}
    </div>
  );
}
