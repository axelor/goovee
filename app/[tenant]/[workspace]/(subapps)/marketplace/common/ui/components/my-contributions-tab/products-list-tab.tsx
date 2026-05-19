import Link from 'next/link';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {clone} from '@/utils';
import {
  ListMyProduct,
  type CompatibilityVersion,
  type ListCategory,
} from '../../../orm/orm';
import {cn} from '@/utils/css';
import {SUBAPP_CODES} from '@/constants';
import {MyProductsTable} from './my-products-table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/ui/components/pagination';
import {getPaginationButtons} from '@/utils/pagination';
import {t} from '@/locale/server';

type ProductsListTabProps = {
  products: ListMyProduct[];
  title: string;
  workspaceURI: string;
  workspaceURL: string;
  categories: ListCategory[];
  compatibilityVersions: CompatibilityVersion[];
  requiresReview: boolean;
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
  compatibilityVersions,
  requiresReview,
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
        compatibilityVersions={clone(compatibilityVersions)}
        requiresReview={requiresReview}
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
                      pathname: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-contributions`,
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
                            pathname: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-contributions`,
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
                      pathname: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-contributions`,
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
