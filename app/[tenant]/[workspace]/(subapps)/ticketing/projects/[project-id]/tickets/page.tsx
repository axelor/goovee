// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {Tenant} from '@/tenant';
import type {PortalAppConfig} from '@/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components';
import {Button} from '@/ui/components/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/pagination';
import {Skeleton} from '@/ui/components/skeleton';
import {clone} from '@/utils';
import {cn} from '@/utils/css';
import {getPaginationButtons} from '@/utils/pagination';
import {decodeFilter, getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import type {ID} from '@goovee/orm';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {Suspense} from 'react';
import {FaChevronRight} from 'react-icons/fa';
import {MdAdd} from 'react-icons/md';

// ---- LOCAL IMPORTS ---- //
import {DEFAULT_SORT, FIELDS, sortKeyPathMap} from '../../../common/constants';
import {
  findClientPartner,
  findCompany,
  findMainPartnerContacts,
  findProject,
  findTicketCategories,
  findTicketPriorities,
  findTicketStatuses,
} from '../../../common/orm/projects';
import {findTickets} from '../../../common/orm/tickets';
import type {SearchParams} from '../../../common/types/search-param';
import {Filter} from '../../../common/ui/components/filter';
import {TicketList} from '../../../common/ui/components/ticket-list';
import {getPages} from '../../../common/utils';
import {ensureAuth} from '../../../common/utils/auth-helper';
import {
  getOrderBy,
  getSkip,
  getWhere,
} from '../../../common/utils/search-param';
import Search from '../search';

const TICKETS_PER_PAGE = 10;
export default async function Page({
  params,
  searchParams,
}: {
  params: {tenant: string; workspace: string; 'project-id': string};
  searchParams: SearchParams;
}) {
  const projectId = params?.['project-id'];

  const {
    limit = TICKETS_PER_PAGE,
    page = 1,
    sort = DEFAULT_SORT,
    filter,
    title,
  } = searchParams;

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const {error, info, forceLogin} = await ensureAuth(workspaceURL, tenant);
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.ticketing}/projects/${projectId}/tickets?${new URLSearchParams(searchParams).toString()}`,
        workspaceURI,
        tenant,
      }),
    );
  }

  if (error) notFound();
  const {auth, workspace} = info;

  const project = await findProject(projectId, auth);

  if (!project) notFound();

  const tickets = await findTickets({
    projectId,
    take: +limit,
    skip: getSkip(limit, page),
    where: getWhere(decodeFilter(filter), auth.userId),
    orderBy: getOrderBy(sort, sortKeyPathMap),
    auth,
  }).then(clone);

  const allowedFields = new Set(
    workspace.config.ticketingFieldSet?.map(f => f.name),
  );

  const hasFilter = [
    FIELDS.PRIORITY,
    FIELDS.STATUS,
    FIELDS.UPDATED_ON,
    FIELDS.CREATED_BY,
    FIELDS.MANAGED_BY,
    FIELDS.ASSIGNMENT,
  ].some(field => allowedFields.has(field));

  const url = `${workspaceURI}/ticketing/projects/${projectId}/tickets`;
  const pages = getPages(tickets, limit);
  return (
    <div className="container my-6 space-y-6 mx-auto">
      <div className="flex flex-col items-center justify-between md:flex-row gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-foreground-muted cursor-pointer truncate text-md">
                <Link href={`${workspaceURI}/ticketing`}>
                  {await t('Projects')}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <FaChevronRight className="text-primary" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="cursor-pointer max-w-[8ch] md:max-w-[15ch] truncate text-md">
                <Link href={`${workspaceURI}/ticketing/projects/${projectId}`}>
                  {project.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <FaChevronRight className="text-primary" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate text-lg font-semibold">
                <h2 className="font-semibold text-xl">
                  {await t(title || 'Tickets')}
                </h2>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button variant="success" className="flex items-center" asChild>
          <Link
            href={`${workspaceURI}/ticketing/projects/${projectId}/tickets/create`}>
            <MdAdd className="size-6" />
            <span>{await t('Create a ticket')}</span>
          </Link>
        </Button>
      </div>
      <div className="lg:flex items-end justify-between gap-6">
        <Search
          projectId={projectId}
          inputClassName="h-[39px] placeholder:!text-sm text-sm"
        />
        {hasFilter && (
          <Suspense
            fallback={
              <Skeleton className="h-10 w-[400px] bg-success-light shrink-0" />
            }>
            <AsyncFilter
              url={url}
              searchParams={searchParams}
              projectId={projectId}
              tenantId={tenant}
              fields={workspace.config.ticketingFieldSet}
            />
          </Suspense>
        )}
      </div>
      <div>
        <TicketList
          tickets={tickets}
          fields={clone(workspace.config.ticketingFieldSet)}
        />
        {pages > 1 && (
          <TablePagination
            url={url}
            pages={pages}
            searchParams={searchParams}
          />
        )}
      </div>
    </div>
  );
}

type TablePaginationProps = {
  url: string;
  searchParams: SearchParams;
  pages: number;
};

function TablePagination(props: TablePaginationProps) {
  const {url, searchParams, pages} = props;
  const {page = 1} = searchParams;
  return (
    <Pagination className="p-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious asChild>
            <Link
              replace
              scroll={false}
              className={cn({['invisible']: +page <= 1})}
              href={{pathname: url, query: {...searchParams, page: +page - 1}}}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Link>
          </PaginationPrevious>
        </PaginationItem>
        {getPaginationButtons({currentPage: +page, totalPages: pages}).map(
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
            );
          },
        )}
        <PaginationItem>
          <PaginationNext asChild>
            <Link
              replace
              scroll={false}
              className={cn({['invisible']: +page >= pages})}
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

async function AsyncFilter({
  url,
  searchParams,
  projectId,
  tenantId,
  fields,
}: {
  url: string;
  searchParams: SearchParams;
  projectId: ID;
  tenantId: Tenant['id'];
  fields: PortalAppConfig['ticketingFieldSet'];
}) {
  const [contacts, statuses, priorities, company, clientPartner, categories] =
    await Promise.all([
      findMainPartnerContacts(projectId, tenantId),
      findTicketStatuses(projectId, tenantId),
      findTicketPriorities(projectId, tenantId),
      findCompany(projectId, tenantId),
      findClientPartner(projectId, tenantId),
      findTicketCategories(projectId, tenantId),
    ]).then(clone);

  return (
    <Filter
      contacts={contacts}
      priorities={priorities}
      statuses={statuses}
      company={company}
      categories={categories}
      url={url}
      searchParams={searchParams}
      clientPartner={clientPartner}
      fields={clone(fields)}
    />
  );
}
