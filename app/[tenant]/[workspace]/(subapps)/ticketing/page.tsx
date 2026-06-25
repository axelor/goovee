import {ChevronLeft, ChevronRight} from 'lucide-react';

// ---- CORE IMPORTS ---- //
import {IMAGE_URL, SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import type {OverlayColor} from '@/types';
import {t} from '@/locale/server';
import {HeroSearch} from '@/ui/components';
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
import {workspacePathname} from '@/utils/workspace';
import {Link} from '@/ui/components/link';
import {notFound, redirect, unauthorized} from 'next/navigation';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getTicketingConfig} from './common/orm/config';
import {withBasePath} from '@/lib/core/path/base-path';
import {getPages, getSkip} from '@/utils/pagination';

// ---- LOCAL IMPORTS ---- //
import {formatNumber} from '@/locale/server/formatters';
import {findProjectsWithTaskCount} from './common/orm/projects';
import {getPaginationButtons} from '@/utils/pagination';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const {limit = 8, page = 1} = searchParams;

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: false,
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

  const {user, subapp} = access;
  const {client} = access.tenant;

  const config = await getTicketingConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  const projects = await findProjectsWithTaskCount({
    take: +limit,
    skip: getSkip(limit, page),
    client,
    user,
    subapp,
    workspace: access.workspace,
  });

  const pages = getPages(projects, limit);
  if (pages == 1 && projects.length === 1) {
    redirect(`${workspaceURI}/ticketing/projects/${projects[0].id}`);
  }
  if (!projects.length) {
    <h3>{await t('No projects found')}</h3>;
  }

  const imageURL = config.ticketHeroBgImage?.id
    ? withBasePath(
        `${workspaceURI}/${SUBAPP_CODES.ticketing}/api/hero/background`,
      )
    : withBasePath(IMAGE_URL);

  return (
    <>
      <HeroSearch
        title={config.ticketHeroTitle || (await t('app-ticketing'))}
        description={
          config.ticketHeroDescription ||
          (await t(
            'Mi eget leo viverra cras pharetra enim viverra. Ac at non pretium etiam viverra. Ac at non pretium etiam',
          ))
        }
        background={
          (config.ticketHeroOverlayColorSelect as OverlayColor) || 'default'
        }
        blendMode={config.ticketHeroOverlayColorSelect ? 'overlay' : 'normal'}
        image={imageURL}
      />
      <div className="container py-6 space-y-6">
        {projects.length === 0 ? (
          <h2 className="font-semibold text-xl text-center">
            {await t('No projects found')}
          </h2>
        ) : (
          <h2 className="font-semibold text-xl">
            {await t('Choose your project')}
          </h2>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(async project => (
            <Link
              key={project.id}
              href={`${workspaceURI}/ticketing/projects/${project.id}`}>
              <div className="bg-card p-6 rounded-lg">
                <p className="text-[1rem] font-semibold text-ellipsis whitespace-nowrap overflow-hidden">
                  {project.name}
                </p>
                <p className="text-[12px] font-medium mt-2">
                  {formatNumber(project.taskCount)}{' '}
                  {project.taskCount === 1
                    ? await t('ticket')
                    : await t('tickets')}
                </p>
              </div>
            </Link>
          ))}
        </div>
        {pages > 1 && (
          <Pagination className="!mb-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious asChild>
                  <Link
                    scroll={false}
                    className={cn({['invisible']: +page <= 1})}
                    replace
                    href={{
                      pathname: `${workspaceURI}/ticketing`,
                      query: {...searchParams, page: +page - 1},
                    }}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous</span>
                  </Link>
                </PaginationPrevious>
              </PaginationItem>
              {getPaginationButtons({
                currentPage: +page,
                totalPages: pages,
              }).map((value, i) => {
                if (typeof value == 'string') {
                  return (
                    <PaginationItem key={i}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return (
                  <PaginationItem key={value}>
                    <PaginationLink isActive={+page === value} asChild>
                      <Link
                        scroll={false}
                        replace
                        href={{
                          pathname: `${workspaceURI}/ticketing`,
                          query: {...searchParams, page: value},
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
                    className={cn({['invisible']: +page >= pages})}
                    href={{
                      pathname: `${workspaceURI}/ticketing`,
                      query: {...searchParams, page: +page + 1},
                    }}>
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  );
}
