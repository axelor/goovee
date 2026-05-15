import Link from 'next/link';
import {Pencil, ExternalLink, ChevronLeft, ChevronRight} from 'lucide-react';
import {ListMyProduct} from '../../../orm/orm';
import {ProductIcon} from '../product-icon';
import {InnerHTML} from '@/ui/components/inner-html';
import {cn} from '@/utils/css';
import {SUBAPP_CODES} from '@/constants';
import {MARKETPLACE_VERSION_STATUS} from '../../../constant/statuses';
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

type ProductsListTabProps = {
  products: ListMyProduct[];
  title: string;
  workspaceURI: string;
  page?: number;
  totalPages?: number;
  paramName?: string;
};

export function ProductsListTab({
  products,
  title,
  workspaceURI,
  page = 1,
  totalPages = 1,
  paramName,
}: ProductsListTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-gray-fog px-6 py-4 border-b border-border">
          <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_80px] gap-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              NAME
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              STATUS
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              CURRENT VERSION
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              INSTALLS
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              RATING
            </div>
            <div></div>
          </div>
        </div>

        {/* Rows */}
        <div>
          {products.map((product, index) => (
            <div
              key={product.id}
              className={cn(
                'border-b border-border px-6 py-4 grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_80px] gap-4 items-center',
                index === products.length - 1 && 'border-b-0',
              )}>
              {/* Name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-muted flex items-center justify-center">
                  <ProductIcon
                    code={product.marketplaceIconCode}
                    className="w-6 h-6"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {product.name}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    <InnerHTML content={product.description ?? undefined} />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <div
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                    product.currentVersion?.statusSelect ===
                    MARKETPLACE_VERSION_STATUS.PUBLISHED
                      ? 'bg-success/15 text-success-dark'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                  {product.currentVersion?.statusSelect || '—'}
                </div>
              </div>

              {/* Version */}
              <div className="text-sm text-foreground">
                v{product.currentVersion?.versionNumber || '—'}
              </div>

              {/* Installs */}
              <div className="text-sm text-foreground">
                {product.installCount ?? 0}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({length: 5}).map((_, i) => (
                    <span key={i} className="text-palette-amber">
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-foreground">
                  {product.averageRating ? String(product.averageRating) : '—'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-1">
                <button className="p-1.5 rounded-full hover:bg-muted transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <Link
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}`}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="text-sm text-muted-foreground">
              No {title.toLowerCase()} yet
            </div>
          </div>
        )}
      </div>

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
                    <span className="sr-only">Previous</span>
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
                    <span className="sr-only">Next</span>
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
