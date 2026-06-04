import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
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
import {getPaginationButtons} from '@/utils/pagination';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import Link from 'next/link';
import {
  ListMyProduct,
  type CompatibilityVersion,
  type ListCategory,
  type ListLicense,
} from '../../../../orm';
import type {Currency} from '@/product/orm';
import {MyProductsTable} from '../../tables/my-products-table';

type ProductsListTabProps = {
  products: ListMyProduct[];
  title: string;
  workspaceURI: string;
  workspaceURL: string;
  categories: ListCategory[];
  licenses: ListLicense[];
  compatibilityVersions: CompatibilityVersion[];
  requiresReview: boolean;
  allowToPublish: boolean;
  newListingCurrency: Currency | null;
  inAti: boolean;
  page?: number;
  totalPages?: number;
  paramName?: string;
};

export async function ProductsListTab({
  products,
  title,
  workspaceURI,
  workspaceURL,
  categories,
  licenses,
  compatibilityVersions,
  requiresReview,
  allowToPublish,
  newListingCurrency,
  inAti,
  page = 1,
  totalPages = 1,
  paramName,
}: ProductsListTabProps) {
  const [previousLabel, nextLabel] = await Promise.all([
    t('Previous'),
    t('Next'),
  ]);
  return (
    <div className="space-y-6">
      <MyProductsTable
        products={clone(products)}
        title={title}
        workspaceURI={workspaceURI}
        workspaceURL={workspaceURL}
        categories={clone(categories)}
        licenses={clone(licenses)}
        compatibilityVersions={clone(compatibilityVersions)}
        requiresReview={requiresReview}
        allowToPublish={allowToPublish}
        newListingCurrency={clone(newListingCurrency)}
        inAti={inAti}
      />

      {/* Pagination */}
      {paramName && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious asChild>
                  <Link
                    scroll={false}
                    replace
                    className={cn({
                      ['pointer-events-none opacity-50']: page <= 1,
                    })}
                    href={{
                      pathname: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-account/contributions`,
                      query: {
                        tab: paramName === 'skillsPage' ? 'skills' : 'apps',
                        [paramName]: Math.max(1, page - 1),
                      },
                    }}>
                    <span className="sr-only">{previousLabel}</span>
                    <ChevronLeft className="h-4 w-4" />
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
                            pathname: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-account/contributions`,
                            query: {
                              tab:
                                paramName === 'skillsPage' ? 'skills' : 'apps',
                              [paramName]: String(value),
                            },
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
                    className={cn({
                      ['pointer-events-none opacity-50']: page >= totalPages,
                    })}
                    href={{
                      pathname: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-account/contributions`,
                      query: {
                        tab: paramName === 'skillsPage' ? 'skills' : 'apps',
                        [paramName]: page + 1,
                      },
                    }}>
                    <span className="sr-only">{nextLabel}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
