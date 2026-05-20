import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {ChevronLeft, ChevronRight} from 'lucide-react';

import {SUBAPP_CODES} from '@/constants';
import {getLoginURL} from '@/utils/url';
import {t} from '@/locale/server';
import {workspacePathname} from '@/utils/workspace';
import {clone} from '@/utils';
import {cn} from '@/utils/css';
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
import {getPaginationButtons, getSkip, getPages} from '@/utils/pagination';

import {ensureAuth} from '../common/utils/auth-helper';
import {findPurchases} from '../common/orm/orm';
import {MyPurchasesTable} from '../common/ui/components/my-purchases-table';
import {DEFAULT_MARKETPLACE_TYPE_SEGMENT} from '../common/constants/route-types';

const PAGE_SIZE = 10;

export default async function MyPurchasesPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{page?: string; limit?: string}>;
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

  const {error, auth, forceLogin} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: false,
  });
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-purchases`,
        workspaceURI,
        tenant: tenantId,
      }),
    );
  }
  if (error) notFound();

  const limit = Number(searchParams.limit) || PAGE_SIZE;
  const page = Number(searchParams.page) || 1;

  const purchases = await findPurchases({
    client: auth.tenant.client,
    partnerId: auth.user.mainPartnerId,
    take: limit,
    skip: getSkip(limit, page),
  });

  const totalPages = getPages(purchases, limit);

  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;
  const purchasesHref = `${marketplaceBase}/my-purchases`;

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={`${marketplaceBase}/${DEFAULT_MARKETPLACE_TYPE_SEGMENT}`}>
                {await t('Marketplace')}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{await t('My purchases')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold text-foreground mb-6">
        {await t('My purchases')}
      </h1>

      {purchases.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {await t("You haven't purchased anything yet.")}
          </p>
          <Button asChild>
            <Link
              href={`${marketplaceBase}/${DEFAULT_MARKETPLACE_TYPE_SEGMENT}`}>
              {await t('Browse marketplace')}
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <MyPurchasesTable
            purchases={clone(purchases)}
            workspaceURI={workspaceURI}
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
                        pathname: purchasesHref,
                        query: {...searchParams, page: page - 1},
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
                      className={cn({['invisible']: page >= totalPages})}
                      href={{
                        pathname: purchasesHref,
                        query: {...searchParams, page: page + 1},
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
