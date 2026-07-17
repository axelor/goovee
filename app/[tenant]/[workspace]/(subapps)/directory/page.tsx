import {ChevronLeft, ChevronRight} from 'lucide-react';
import {notFound, redirect, unauthorized} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {IMAGE_URL, SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import type {OverlayColor} from '@/types';
import {t} from '@/lib/core/locale/server';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/pagination';
import {clone} from '@/utils';
import {getPaginationButtons, getPages, getSkip} from '@/utils/pagination';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {withBasePath} from '@/lib/core/path/base-path';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {getDirectoryConfig} from './common/orm/config';
import {findEntries, findMapConfig} from './common/orm';
import type {ListEntry, SearchParams} from './common/types';
import {Card} from './common/ui/components/card';
import {Filter} from './common/ui/components/filter';
import {Map} from './common/ui/components/map';
import {MapSkeleton} from './common/ui/components/map/map-skeleton';
import {getOrderBy} from './common/utils';
import Hero from './hero';
import {Client} from '@/goovee/.generated/client';

const ITEMS_PER_PAGE = 7;

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.directory,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  if (!access.ok) {
    if (
      access.reason === 'workspace-not-found' ||
      access.reason === 'app-not-installed'
    ) {
      notFound();
    }
    if (!access.user) {
      redirect(
        getLoginURL({
          callbackurl: await getCurrentPath(),
          workspaceURI,
          [SEARCH_PARAMS.TENANT_ID]: tenant,
        }),
      );
    }
    unauthorized();
  }

  const {client} = access.tenant;

  const config = await getDirectoryConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  const {page = 1, limit = ITEMS_PER_PAGE, sort, city, zip} = searchParams;

  const partners = await findEntries({
    orderBy: getOrderBy(sort),
    take: +limit,
    skip: getSkip(limit, page),
    client,
    city,
    zip,
  });

  const pages = getPages(partners, limit);
  const imageURL = config?.directoryHeroBgImage?.id
    ? withBasePath(
        `${workspaceURI}/${SUBAPP_CODES.directory}/api/hero/background`,
      )
    : withBasePath(IMAGE_URL);

  return (
    <div className="bg-ink-25 min-h-full">
      <Hero
        title={config?.directoryHeroTitle}
        description={config?.directoryHeroDescription}
        background={
          config?.directoryHeroOverlayColorSelect as OverlayColor | null
        }
        image={imageURL}
      />
      <div className="container py-8">
        <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-4 mb-6">
          <Filter />
        </div>
        {!partners || partners.length === 0 ? (
          <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-12 text-center mt-4">
            <h2 className="font-semibold text-base text-ink-700">
              {await t('No entries found.')}
            </h2>
          </div>
        ) : (
          <div className="flex has-[.expand]:flex-col gap-6 mt-4 items-start">
            <Suspense fallback={<MapSkeleton />}>
              <ServerMap entries={partners} client={client} />
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
        )}
      </div>
    </div>
  );
}

async function ServerMap(props: {entries: ListEntry[]; client: Client}) {
  const {entries, client} = props;
  const mapConfig = await findMapConfig({client});

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
