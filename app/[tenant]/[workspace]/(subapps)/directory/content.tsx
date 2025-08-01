import {ChevronLeft, ChevronRight} from 'lucide-react';
import Link from 'next/link';

// ---- CORE IMPORTS ---- //
import {t} from '@/lib/core/locale/server';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/pagination';
import {clone} from '@/utils';
import {getPaginationButtons} from '@/utils/pagination';

// ---- LOCAL IMPORTS ---- //
import type {ID} from '@/types';
import {Suspense} from 'react';
import {findMapConfig} from './common/orm';
import type {ListEntry, SearchParams} from './common/types';
import {Card} from './common/ui/components/card';
import {Map} from './common/ui/components/map';
import {MapSkeleton} from './common/ui/components/map/map-skeleton';
import {Sort} from './common/ui/components/sort';

type ContentProps = {
  workspaceURI: string;
  url: string;
  entries: ListEntry[];
  tenant: string;
  pages: number;
  searchParams: SearchParams;
  workspaceId: ID;
};

export async function Content({
  workspaceURI,
  tenant,
  pages,
  searchParams,
  entries,
  url,
  workspaceId,
}: ContentProps) {
  if (!entries || entries.length === 0) {
    return (
      <h2 className="font-semibold text-xl text-center mt-5">
        {await t('No entries found.')}
      </h2>
    );
  }

  return (
    <>
      {/* NOTE: expand class applied by the map , when it is expanded and when it is in mobile view */}
      <div className="flex has-[.expand]:flex-col gap-4 mt-4">
        <aside className="space-y-4 z-10">
          <Suspense fallback={<MapSkeleton />}>
            <ServerMap
              entries={entries}
              workspaceId={workspaceId}
              tenant={tenant}
            />
          </Suspense>
          <Sort />
        </aside>
        <main className="grow flex flex-col gap-4">
          {entries.map(item => (
            <Card
              item={item}
              url={`${workspaceURI}/directory/entry/${item.id}`}
              key={item.id}
              workspaceURI={workspaceURI}
            />
          ))}
        </main>
      </div>
      {pages > 1 && (
        <CardPagination url={url} pages={pages} searchParams={searchParams} />
      )}
    </>
  );
}

async function ServerMap(props: {
  entries: ContentProps['entries'];
  workspaceId: ID;
  tenant: string;
}) {
  const {entries, workspaceId, tenant} = props;
  const mapConfig = await findMapConfig({workspaceId, tenantId: tenant});
  return <Map showExpand entries={clone(entries)} config={mapConfig} />;
}

type CardPaginationProps = {
  url: string;
  searchParams: SearchParams;
  pages: number;
};

function CardPagination({url, searchParams, pages}: CardPaginationProps) {
  const {page = 1} = searchParams;

  return (
    <Pagination className="p-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious asChild>
            <Link
              replace
              scroll={false}
              className={+page <= 1 ? 'invisible' : ''}
              href={{pathname: url, query: {...searchParams, page: +page - 1}}}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Link>
          </PaginationPrevious>
        </PaginationItem>
        {getPaginationButtons({currentPage: +page, totalPages: pages}).map(
          (value, i) =>
            typeof value === 'string' ? (
              <PaginationItem key={i}>
                <span className="pagination-ellipsis">...</span>
              </PaginationItem>
            ) : (
              <PaginationItem key={value}>
                <PaginationLink isActive={+page === value} asChild>
                  <Link
                    replace
                    scroll={false}
                    href={{
                      pathname: url,
                      query: {...searchParams, page: value},
                    }}>
                    {value}
                  </Link>
                </PaginationLink>
              </PaginationItem>
            ),
        )}
        <PaginationItem>
          <PaginationNext asChild>
            <Link
              replace
              scroll={false}
              className={+page >= pages ? 'invisible' : ''}
              href={{pathname: url, query: {...searchParams, page: +page + 1}}}>
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
