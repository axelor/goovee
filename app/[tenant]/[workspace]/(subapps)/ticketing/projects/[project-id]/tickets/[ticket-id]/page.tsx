import type {ID} from '@goovee/orm';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Suspense} from 'react';
import {FaChevronRight} from 'react-icons/fa';

// ---- CORE IMPORTS ---- //
import {Comments, isCommentEnabled, SORT_TYPE} from '@/comments';
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {type Tenant} from '@/tenant';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components';
import {Skeleton} from '@/ui/components/skeleton';
import {clone} from '@/utils';
import {encodeFilter} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import type {PortalAppConfig} from '@/types';
import {createComment, fetchComments} from '../../../../common/actions';
import {ALL_TICKETS_TITLE} from '../../../../common/constants';
import {
  findContactPartners,
  findTicketCategories,
  findTicketPriorities,
  findTicketStatuses,
} from '../../../../common/orm/projects';
import {
  findChildTicketIds,
  findChildTickets,
  findParentTicket,
  findParentTicketIds,
  findRelatedTicketLinks,
  findTicket,
  findTicketLinkTypes,
} from '../../../../common/orm/tickets';
import type {
  Category,
  ContactPartner,
  Priority,
} from '../../../../common/types';
import {TicketDetails} from '../../../../common/ui/components/ticket-details';
import {TicketDetailsProvider} from '../../../../common/ui/components/ticket-details/ticket-details-provider';
import {
  ChildTicketList,
  ParentTicketList,
  RelatedTicketList,
} from '../../../../common/ui/components/ticket-list';
import {ensureAuth} from '../../../../common/utils/auth-helper';
import {EncodedFilter} from '../../../../common/utils/validators';
import {
  ChildTicketsHeader,
  ParentTicketsHeader,
  RelatedTicketsHeader,
} from './headers';

export default async function Page({
  params,
}: {
  params: {
    tenant: string;
    workspace: string;
    'project-id': string;
    'ticket-id': string;
  };
}) {
  const {workspaceURI, workspaceURL} = workspacePathname(params);
  const projectId = params['project-id'];
  const ticketId = params['ticket-id'];

  const {tenant} = params;

  const {error, info} = await ensureAuth(workspaceURL, tenant);
  if (error) notFound();
  const {auth, workspace} = info;

  const [ticket, statuses, categories, priorities, contacts] =
    await Promise.all([
      findTicket({ticketId, projectId, auth}),
      findTicketStatuses(projectId, tenant),
      findTicketCategories(projectId, tenant),
      findTicketPriorities(projectId, tenant),
      findContactPartners(projectId, tenant),
    ]).then(clone);

  if (!ticket) notFound();

  const ticketsURL = `${workspaceURI}/ticketing/projects/${projectId}/tickets`;
  const status = statuses.filter(s => !s.isCompleted).map(s => s.id);
  const allTicketsURL = `${ticketsURL}?filter=${encodeFilter<EncodedFilter>({status})}&title=${encodeURIComponent(ALL_TICKETS_TITLE)}`;

  return (
    <div className="container mt-5 mb-20">
      <Breadcrumb className="flex-shrink">
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
                {ticket.project?.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <FaChevronRight className="text-primary" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild className="cursor-pointer text-md">
              <Link href={allTicketsURL}>{await t(ALL_TICKETS_TITLE)}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <FaChevronRight className="text-primary" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate text-lg font-semibold">
              <h2 className="font-semibold text-xl">{ticket.name}</h2>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <TicketDetailsProvider ticket={ticket}>
        <>
          <TicketDetails
            categories={categories}
            priorities={priorities}
            contacts={contacts}
          />
          <div className="space-y-4 rounded-md border bg-card p-4 mt-5">
            <Suspense fallback={<Skeleton className="h-[160px]" />}>
              <ParentTicket
                ticketId={ticket.id}
                projectId={ticket.project?.id}
                tenantId={tenant}
                ticketingFieldSet={workspace.config.ticketingFieldSet}
              />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[160px]" />}>
              <ChildTickets
                projectId={ticket.project?.id}
                ticketId={ticket.id}
                categories={categories}
                priorities={priorities}
                contacts={contacts}
                userId={auth.userId}
                tenantId={tenant}
                ticketingFieldSet={workspace.config.ticketingFieldSet}
              />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[160px]" />}>
              <RelatedTickets
                ticketId={ticket.id}
                projectId={ticket.project?.id}
                tenantId={tenant}
                ticketingFieldSet={workspace.config.ticketingFieldSet}
              />
            </Suspense>
          </div>
        </>
      </TicketDetailsProvider>

      {isCommentEnabled({subapp: SUBAPP_CODES.ticketing, workspace}) && (
        <div className="rounded-md border bg-card p-4 mt-5">
          <h4 className="text-xl font-semibold border-b">
            {await t('Comments')}
          </h4>
          <Comments
            key={Math.random()}
            recordId={ticket.id}
            subapp={SUBAPP_CODES.ticketing}
            sortBy={SORT_TYPE.new}
            showCommentsByDefault
            hideTopBorder
            hideSortBy
            hideCloseComments
            hideCommentsHeader
            showRepliesInMainThread
            trackingField="publicBody"
            commentField="note"
            createComment={createComment}
            fetchComments={fetchComments}
          />
        </div>
      )}
    </div>
  );
}

async function ChildTickets({
  ticketId,
  projectId,
  categories,
  priorities,
  contacts,
  userId,
  tenantId,
  ticketingFieldSet,
}: {
  ticketId: ID;
  projectId?: ID;
  categories: Category[];
  priorities: Priority[];
  contacts: ContactPartner[];
  userId: ID;
  tenantId: Tenant['id'];
  ticketingFieldSet: PortalAppConfig['ticketingFieldSet'];
}) {
  if (!projectId) return;

  const [parentIds, tickets] = await Promise.all([
    findParentTicketIds(ticketId, tenantId),
    findChildTickets(ticketId, tenantId).then(clone),
  ]);
  return (
    <div>
      <ChildTicketsHeader
        ticketId={ticketId}
        parentIds={parentIds}
        childrenIds={tickets?.map(t => t.id) ?? []}
        projectId={projectId}
        categories={categories}
        priorities={priorities}
        contacts={contacts}
        userId={userId}
      />
      <hr className="mt-5" />
      <ChildTicketList
        ticketId={ticketId.toString()}
        tickets={tickets}
        ticketingFieldSet={clone(ticketingFieldSet)}
      />
    </div>
  );
}

async function ParentTicket({
  projectId,
  ticketId,
  tenantId,
  ticketingFieldSet,
}: {
  projectId?: ID;
  ticketId: ID;
  tenantId: Tenant['id'];
  ticketingFieldSet: PortalAppConfig['ticketingFieldSet'];
}) {
  if (!projectId) return;
  const [childIds, ticket] = await Promise.all([
    findChildTicketIds(ticketId, tenantId),
    findParentTicket(ticketId, tenantId).then(clone),
  ]);
  return (
    <div>
      <ParentTicketsHeader
        ticketId={ticketId}
        projectId={projectId}
        childrenIds={childIds}
        parentId={ticket?.id}
      />
      <hr className="mt-5" />
      <ParentTicketList
        ticketingFieldSet={clone(ticketingFieldSet)}
        tickets={ticket ? [ticket] : []}
        ticketId={ticketId.toString()}
      />
    </div>
  );
}

async function RelatedTickets({
  ticketId,
  projectId,
  tenantId,
  ticketingFieldSet,
}: {
  ticketId: ID;
  projectId?: ID;
  tenantId: Tenant['id'];
  ticketingFieldSet: PortalAppConfig['ticketingFieldSet'];
}) {
  if (!projectId) return;
  const [linkTypes, links] = await Promise.all([
    findTicketLinkTypes(projectId, tenantId),
    findRelatedTicketLinks(ticketId, tenantId),
  ]).then(clone);

  return (
    <div>
      <RelatedTicketsHeader
        linkTypes={linkTypes}
        ticketId={ticketId}
        links={links ?? []}
        projectId={projectId}
      />
      <hr className="mt-5" />
      <RelatedTicketList
        links={links ?? []}
        ticketId={ticketId.toString()}
        ticketingFieldSet={clone(ticketingFieldSet)}
      />
    </div>
  );
}
