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
import {getPaginationButtons} from '@/utils/pagination';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import Link from 'next/link';

export type PageLinksProps = {
  url: string;
  searchParams: Record<string, string | undefined>;
  pages: number;
  pageKey?: string;
  className?: string;
};

export function PageLinks(props: PageLinksProps) {
  const {url, searchParams, pages, pageKey = 'page', className} = props;
  const page = +(searchParams[pageKey] || 1);
  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious asChild>
            <Link
              replace
              scroll={false}
              className={cn({['invisible']: page <= 1})}
              href={{
                pathname: url,
                query: {...searchParams, [pageKey]: page - 1},
              }}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Link>
          </PaginationPrevious>
        </PaginationItem>
        {getPaginationButtons({currentPage: page, totalPages: pages}).map(
          (value, i) => {
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
                    replace
                    scroll={false}
                    href={{
                      pathname: url,
                      query: {...searchParams, [pageKey]: value},
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
              replace
              scroll={false}
              className={cn({['invisible']: page >= pages})}
              href={{
                pathname: url,
                query: {...searchParams, [pageKey]: page + 1},
              }}>
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
