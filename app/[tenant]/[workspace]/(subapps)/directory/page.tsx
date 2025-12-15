import {ChevronLeft, ChevronRight} from 'lucide-react';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {IMAGE_URL, SUBAPP_CODES} from '@/constants';
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
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {findEntries, findMapConfig} from './common/orm';
import type {ListEntry, SearchParams} from './common/types';
import {Card} from './common/ui/components/card';
import {Filter} from './common/ui/components/filter';
import {Map} from './common/ui/components/map';
import {MapSkeleton} from './common/ui/components/map/map-skeleton';
import {getOrderBy, getPages, getSkip} from './common/utils';
import {ensureAuth} from './common/utils/auth-helper';
import Hero from './hero';

const ITEMS_PER_PAGE = 7;

export default async function Page({
  params,
  searchParams,
}: {
  params: {tenant: string; workspace: string};
  searchParams: SearchParams;
}) {
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);
  const {error, auth} = await ensureAuth(workspaceURL, tenant);
  if (error) notFound();

  const {workspace} = auth;

  const {page = 1, limit = ITEMS_PER_PAGE, sort, city, zip} = searchParams;

  const partners = await findEntries({
    orderBy: getOrderBy(sort),
    take: +limit,
    skip: getSkip(limit, page),
    tenantId: tenant,
    city,
    zip,
  });

  const pages = getPages(partners, limit);
  const imageURL = workspace.config?.directoryHeroBgImage?.id
    ? `${workspaceURI}/${SUBAPP_CODES.directory}/api/hero/background`
    : IMAGE_URL;

  return (
    <>
      <Hero
        title={workspace.config?.directoryHeroTitle}
        description={workspace.config?.directoryHeroDescription}
        background={workspace.config?.directoryHeroOverlayColorSelect}
        image={imageURL}
      />
      <div className="container mb-5">
        <div className="my-4">
          <Filter />
        </div>
        {!partners || partners.length === 0 ? (
          <h2 className="font-semibold text-xl text-center mt-5">
            {await t('No entries found.')}
          </h2>
        ) : (
          <>
            {/* NOTE: expand class applied by the map , when it is expanded and when it is in mobile view */}
            <div className="flex has-[.expand]:flex-col gap-4 mt-4">
              <Suspense fallback={<MapSkeleton />}>
                <ServerMap entries={partners} tenant={tenant} />
              </Suspense>
              <main className="grow flex flex-col gap-4">
                {partners.map(item => (
                  <Card
                    item={item}
                    url={`${workspaceURI}/${SUBAPP_CODES.directory}/entry/${item.id}`}
                    key={item.id}
                    tenant={tenant}
                  />
                ))}
                {pages > 1 && (
                  <CardPagination
                    url={`${workspaceURI}/${SUBAPP_CODES.directory}`}
                    pages={pages}
                    searchParams={searchParams}
                  />
                )}
              </main>
            </div>
          </>
        )}
      </div>
    </>
  );
}

async function ServerMap(props: {entries: ListEntry[]; tenant: string}) {
  const {entries, tenant} = props;
  const mapConfig = await findMapConfig({tenantId: tenant});

  const mapEntries = entries.filter(
    x => x.mainAddress?.longit && x.mainAddress?.latit,
  );
  if (mapEntries.length === 0) return null;

  return (
    <aside className="space-y-4 z-10">
      <Map showExpand entries={clone(mapEntries)} config={mapConfig} />
    </aside>
  );
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
