import {notFound, redirect, unauthorized} from 'next/navigation';
import {Suspense} from 'react';
import {IconType} from 'react-icons';
import {FaChevronRight} from 'react-icons/fa';
import {
  MdAdd,
  MdArrowForward,
  MdCheckCircleOutline,
  MdFolderOpen,
  MdListAlt,
  MdPersonOutline,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {getTicketingConfig} from '../../common/orm/config';
import {getCurrentPath} from '@/utils/current-path';
import {t} from '@/locale/server';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from '@/ui/components';
import {Skeleton} from '@/ui/components/skeleton';
import {clone} from '@/utils';
import {encodeFilter, getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {formatNumber} from '@/locale/server/formatters';
import {cn} from '@/utils/css';
import {
  ALL_TICKETS_TITLE,
  CREATED_TICKETS_TITLE,
  DEFAULT_SORT,
  MANAGED_TICKETS_TITLE,
  MY_TICKETS_TITLE,
  RESOLVED_TICKETS_TITLE,
  sortKeyPathMap,
} from '../../common/constants';
import {findProject, findTicketStatuses} from '../../common/orm/projects';
import {
  findTickets,
  getAllTicketCount,
  getCreatedTicketCount,
  getManagedTicketCount,
  getMyTicketCount,
  getResolvedTicketCount,
} from '../../common/orm/tickets';
import type {SearchParams} from '../../common/types/search-param';
import {TicketList} from '../../common/ui/components/ticket-list';
import {getSkip} from '@/utils/pagination';
import {getOrderBy} from '../../common/utils/search-param';
import type {EncodedTicketFilter} from '../../common/utils/validators';
import Search from './search';

export default async function Page(props0: {
  params: Promise<{tenant: string; workspace: string; 'project-id': string}>;
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props0.searchParams;
  const params = await props0.params;
  const projectId = params?.['project-id'];

  const {limit = 7, page = 1, sort = DEFAULT_SORT} = searchParams;

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
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

  const [project, tickets, statuses] = await Promise.all([
    findProject({projectId, client, user, workspace: access.workspace}),
    findTickets({
      projectId,
      take: Number(limit),
      skip: getSkip(limit, page),
      orderBy: getOrderBy(sort, sortKeyPathMap),
      where: {status: {isCompleted: false}},
      client,
      user,
      subapp,
    }).then(clone),
    findTicketStatuses(projectId, client),
  ]);

  if (!project) notFound();

  const ticketsURL = `${workspaceURI}/ticketing/projects/${projectId}/tickets`;
  const status = statuses.filter(s => !s.isCompleted).map(s => s.id);
  const statusCompleted = statuses.filter(s => s.isCompleted).map(s => s.id);
  const allTicketsURL = `${ticketsURL}?filter=${encodeFilter<EncodedTicketFilter>({status})}&title=${encodeURIComponent(ALL_TICKETS_TITLE)}`;

  const items = [
    config.isShowAllTickets && {
      label: await t(ALL_TICKETS_TITLE),
      count: getAllTicketCount({projectId, client, user, subapp}),
      icon: MdFolderOpen,
      href: allTicketsURL,
      iconClassName: 'bg-[#fde0ec] text-[#c41e74]',
    },
    config.isShowMyTickets && {
      label: await t(MY_TICKETS_TITLE),
      count: getMyTicketCount({projectId, client, user, subapp}),
      href: `${ticketsURL}?filter=${encodeFilter<EncodedTicketFilter>({status, myTickets: true})}&title=${encodeURIComponent(MY_TICKETS_TITLE)}`,
      icon: MdPersonOutline,
      iconClassName: 'bg-royal-pale text-royal',
    },
    config.isShowManagedTicket && {
      label: await t(MANAGED_TICKETS_TITLE),
      count: getManagedTicketCount({projectId, client, user, subapp}),
      icon: MdListAlt,
      href: `${ticketsURL}?filter=${encodeFilter<EncodedTicketFilter>({status, managedBy: [user.id.toString()]})}&title=${encodeURIComponent(MANAGED_TICKETS_TITLE)}`,
      iconClassName: 'bg-status-feedback-bg text-status-feedback-fg',
    },
    config.isShowCreatedTicket && {
      label: await t(CREATED_TICKETS_TITLE),
      count: getCreatedTicketCount({projectId, client, user, subapp}),
      icon: MdAdd,
      href: `${ticketsURL}?filter=${encodeFilter<EncodedTicketFilter>({status, createdBy: [user.id.toString()]})}&title=${encodeURIComponent(CREATED_TICKETS_TITLE)}`,
      iconClassName: 'bg-status-pending-bg text-status-pending-fg',
    },
    config.isShowResolvedTicket && {
      label: await t(RESOLVED_TICKETS_TITLE),
      count: getResolvedTicketCount({projectId, client, user, subapp}),
      icon: MdCheckCircleOutline,
      href: `${ticketsURL}?filter=${encodeFilter<EncodedTicketFilter>({status: statusCompleted})}&title=${encodeURIComponent(RESOLVED_TICKETS_TITLE)}`,
      iconClassName: 'bg-status-delivered-bg text-status-delivered-fg',
    },
  ]
    .filter(Boolean)
    .map(
      props =>
        props && (
          <Suspense key={props.label} fallback={<TicketCardSkeleton />}>
            <TicketCard {...props} />
          </Suspense>
        ),
    );

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container my-6 space-y-6 mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-ink-500 cursor-pointer truncate text-sm">
                <Link href={`${workspaceURI}/ticketing`}>
                  {await t('Projects')}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <FaChevronRight className="text-ink-300" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="sm:truncate text-sm text-ink-700">
                {project.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
            {await t('Support')}
          </p>
          <h1 className="text-3xl font-bold text-ink-900 tracking-[-0.01em]">
            {project.name}
          </h1>
        </header>
        <Search
          projectId={projectId}
          inputClassName="h-11 placeholder:!text-sm text-sm bg-white border-ink-150"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {items}
        </div>
        <div className="flex items-center justify-between !mt-8">
          <h2 className="font-bold text-xl text-ink-900">
            {await t('Latest tickets')}
          </h2>
          <Button variant="royal" className="flex items-center gap-1.5" asChild>
            <Link href={`${ticketsURL}/create`}>
              <MdAdd className="size-5" />
              <span>{await t('Create a ticket')}</span>
            </Link>
          </Button>
        </div>
        <div className="bg-white rounded-xl border border-ink-100 shadow-xs overflow-hidden">
          <TicketList
            tickets={tickets}
            fields={clone(config.ticketingFieldSet)}
          />
          <div className="flex justify-end p-4 border-t border-ink-100">
            <Link
              href={allTicketsURL}
              className="inline-flex gap-1.5 items-center text-royal text-sm font-semibold hover:underline">
              {await t('See all tickets')}
              <MdArrowForward />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

type TicketCardProps = {
  label: string;
  count: Promise<number>;
  href: string;
  icon: IconType;
  iconClassName: string;
};

const wrapperClassName =
  'flex items-center gap-4 p-[18px] rounded-[14px] border border-ink-100 bg-white shadow-xs';
const iconWrapperClassName =
  'flex items-center justify-center h-10 w-10 rounded-[10px] shrink-0';

async function TicketCard(props: TicketCardProps) {
  const {label, icon: Icon, count: countPromise, href, iconClassName} = props;
  const count = await countPromise;

  return (
    <Link
      href={href}
      className={cn(
        wrapperClassName,
        'group transition-shadow hover:shadow-md',
      )}>
      <div className={cn(iconWrapperClassName, iconClassName)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="grow flex flex-col">
        <h3 className="text-[26px] font-bold text-ink-900 tabular-nums leading-none tracking-[-0.02em]">
          {formatNumber(count)}
        </h3>
        <p className="text-xs font-semibold text-ink-600 mt-1">{label}</p>
      </div>
    </Link>
  );
}

function TicketCardSkeleton() {
  return (
    <div className={wrapperClassName}>
      <Skeleton className={iconWrapperClassName} />
      <div className="grow flex flex-col gap-2">
        <Skeleton className="w-[3rem] h-[2rem]" />
        <Skeleton className="w-[7rem] h-[1rem]" />
      </div>
    </div>
  );
}
