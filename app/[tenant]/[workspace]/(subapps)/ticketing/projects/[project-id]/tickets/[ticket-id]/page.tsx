import type {ID} from '@/types';
import {notFound, redirect, unauthorized} from 'next/navigation';
import {Suspense} from 'react';
import {FaChevronRight} from 'react-icons/fa';

// ---- CORE IMPORTS ---- //
import {Comments, isCommentEnabled, SORT_TYPE} from '@/comments';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import type {Client} from '@/goovee/.generated/client';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
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
import {cn} from '@/utils/css';
import {encodeFilter, getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {withBasePath} from '@/lib/core/path/base-path';
import {workspacePathname} from '@/utils/workspace';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import type {PortalAppConfig} from '@/orm/workspace';
import {getWorkspaceConfig} from '@/orm/workspace';
import {createComment, fetchComments} from '../../../../common/actions';
import {ALL_TICKETS_TITLE} from '../../../../common/constants';
import {
  findMainPartnerContacts,
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
import type {EncodedTicketFilter} from '../../../../common/utils/validators';
import {
  ChildTicketsHeader,
  ParentTicketsHeader,
  RelatedTicketsHeader,
} from './headers';

export default async function Page(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    'project-id': string;
    'ticket-id': string;
  }>;
}) {
  const params = await props.params;
  const {workspaceURI, workspaceURL, tenant} = workspacePathname(params);
  const projectId = params['project-id'];
  const ticketId = params['ticket-id'];

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

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  const workspace = {...access.workspace, config};

  const [ticket, statuses, categories, priorities, contacts] =
    await Promise.all([
      findTicket({ticketId, projectId, client, user, subapp, workspace}),
      findTicketStatuses(projectId, client),
      findTicketCategories(projectId, client),
      findTicketPriorities(projectId, client),
      findMainPartnerContacts(projectId, client),
    ]).then(clone);

  if (!ticket) notFound();

  const ticketsURL = `${workspaceURI}/ticketing/projects/${projectId}/tickets`;
  const status = statuses.filter(s => !s.isCompleted).map(s => s.id);
  const allTicketsURL = `${ticketsURL}?filter=${encodeFilter<EncodedTicketFilter>({status})}&title=${encodeURIComponent(ALL_TICKETS_TITLE)}`;

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
            formFields={clone(workspace.config.ticketingFormFieldSet)}
            showCancel={workspace.config.isDisplayCancelBtn}
            showClose={workspace.config.isDisplayCloseBtn}
            showAssignment={workspace.config.isDisplayAssignmentBtn}
          />

          <div
            className={cn('space-y-4 rounded-md border bg-card p-4 mt-5', {
              ['hidden']:
                !workspace.config.isDisplayTicketParent &&
                !workspace.config.isDisplayChildTicket &&
                !workspace.config.isDisplayRelatedTicket,
            })}>
            {workspace.config.isDisplayTicketParent && (
              <Suspense fallback={<Skeleton className="h-[160px]" />}>
                <ParentTicket
                  ticketId={ticket.id}
                  projectId={ticket.project?.id}
                  client={client}
                  fields={workspace.config.ticketingFieldSet}
                />
              </Suspense>
            )}
            {workspace.config.isDisplayChildTicket && (
              <Suspense fallback={<Skeleton className="h-[160px]" />}>
                <ChildTickets
                  projectId={ticket.project?.id}
                  ticketId={ticket.id}
                  categories={categories}
                  priorities={priorities}
                  contacts={contacts}
                  userId={user.id}
                  client={client}
                  fields={workspace.config.ticketingFieldSet}
                  formFields={workspace.config.ticketingFormFieldSet}
                />
              </Suspense>
            )}
            {workspace.config.isDisplayRelatedTicket && (
              <Suspense fallback={<Skeleton className="h-[160px]" />}>
                <RelatedTickets
                  ticketId={ticket.id}
                  projectId={ticket.project?.id}
                  client={client}
                  fields={workspace.config.ticketingFieldSet}
                />
              </Suspense>
            )}
          </div>
        </>
      </TicketDetailsProvider>

      {isCommentEnabled({
        subapp: SUBAPP_CODES.ticketing,
        config: workspace.config,
      }) && (
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
            attachmentDownloadUrl={withBasePath(
              `${workspaceURI}/${SUBAPP_CODES.ticketing}/api/comments/attachments/${ticket.id}`,
            )}
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
  client,
  fields,
  formFields,
}: {
  ticketId: ID;
  projectId?: ID;
  categories: Category[];
  priorities: Priority[];
  contacts: ContactPartner[];
  userId: ID;
  client: Client;
  fields: PortalAppConfig['ticketingFieldSet'];
  formFields: PortalAppConfig['ticketingFormFieldSet'];
}) {
  if (!projectId) return;

  const [parentIds, tickets] = await Promise.all([
    findParentTicketIds(ticketId, client),
    findChildTickets(ticketId, client).then(clone),
  ]);
  return (
    <div>
      <ChildTicketsHeader
        formFields={clone(formFields)}
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
        fields={clone(fields)}
      />
    </div>
  );
}

async function ParentTicket({
  projectId,
  ticketId,
  client,
  fields,
}: {
  projectId?: ID;
  ticketId: ID;
  client: Client;
  fields: PortalAppConfig['ticketingFieldSet'];
}) {
  if (!projectId) return;
  const [childIds, ticket] = await Promise.all([
    findChildTicketIds(ticketId, client),
    findParentTicket(ticketId, client).then(clone),
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
        fields={clone(fields)}
        tickets={ticket ? [ticket] : []}
        ticketId={ticketId.toString()}
      />
    </div>
  );
}

async function RelatedTickets({
  ticketId,
  projectId,
  client,
  fields,
}: {
  ticketId: ID;
  projectId?: ID;
  client: Client;
  fields: PortalAppConfig['ticketingFieldSet'];
}) {
  if (!projectId) return;
  const [linkTypes, links] = await Promise.all([
    findTicketLinkTypes(projectId, client),
    findRelatedTicketLinks(ticketId, client),
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
        fields={clone(fields)}
      />
    </div>
  );
}
