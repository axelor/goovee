import type {ID} from '@/types';
import {notFound, redirect, unauthorized} from 'next/navigation';
import {Suspense} from 'react';
import {FaChevronRight} from 'react-icons/fa';

// ---- CORE IMPORTS ---- //
import {Comments, isCommentEnabled, SORT_TYPE} from '@/comments';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {formatDate} from '@/locale/formatters';
import type {Client} from '@/goovee/.generated/client';
import {ensureAccess} from '@/lib/core/access/ensure-access';
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
import type {TicketingConfig} from '../../../../common/orm/config';
import {getTicketingConfig} from '../../../../common/orm/config';
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
import {
  TicketCompactHeader,
  TicketSidebar,
} from '../../../../common/ui/components/ticket-details';
import {TicketDetailsProvider} from '../../../../common/ui/components/ticket-details/ticket-details-provider';
import {RichTextViewer} from '@/ui/components/rich-text-editor/rich-text-viewer';
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

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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

  const [ticket, statuses, categories, priorities, contacts] =
    await Promise.all([
      findTicket({
        ticketId,
        projectId,
        client,
        user,
        subapp,
        workspace: access.workspace,
      }),
      findTicketStatuses(projectId, client),
      findTicketCategories(projectId, client),
      findTicketPriorities(projectId, client),
      findMainPartnerContacts(projectId, client),
    ]).then(clone);

  if (!ticket) notFound();

  const ticketsURL = `${workspaceURI}/ticketing/projects/${projectId}/tickets`;
  const status = statuses.filter(s => !s.isCompleted).map(s => s.id);
  const allTicketsURL = `${ticketsURL}?filter=${encodeFilter<EncodedTicketFilter>({status})}&title=${encodeURIComponent(ALL_TICKETS_TITLE)}`;

  // Opening request = the client-authored first message of the conversation.
  const requesterName =
    ticket.createdByContact?.simpleFullName ??
    ticket.project?.company?.name ??
    '';
  const requesterInitials = initialsOf(requesterName);
  const createdOnLabel = ticket.createdOn ? formatDate(ticket.createdOn) : '';

  return (
    <div className="bg-ink-25 min-h-full">
      <TicketDetailsProvider ticket={ticket}>
        {/* Full-width header bar */}
        <div className="bg-white border-b border-ink-100">
          <div className="container py-4 space-y-3">
            <Breadcrumb className="flex-shrink">
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
                  <BreadcrumbLink
                    asChild
                    className="text-ink-500 cursor-pointer max-w-[8ch] md:max-w-[15ch] truncate text-sm">
                    <Link
                      href={`${workspaceURI}/ticketing/projects/${projectId}`}>
                      {ticket.project?.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <FaChevronRight className="text-ink-300" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    asChild
                    className="text-ink-500 cursor-pointer text-sm">
                    <Link href={allTicketsURL}>
                      {await t(ALL_TICKETS_TITLE)}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <FaChevronRight className="text-ink-300" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="truncate text-sm text-ink-700 font-medium">
                    {ticket.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <TicketCompactHeader
              backHref={allTicketsURL}
              showCancel={config.isDisplayCancelBtn}
              showClose={config.isDisplayCloseBtn}
            />
          </div>
        </div>

        <div className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
            {/* Left — conversation */}
            <div className="flex flex-col gap-4 min-w-0">
              <h2 className="text-lg font-bold text-ink-900">
                {await t('Ticketing')}
              </h2>

              {/* Opening request — first message of the thread */}
              {ticket.description && (
                <div className="rounded-xl border border-ink-100 bg-white p-[18px]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-peach-avatar text-[11px] font-bold text-white">
                      {requesterInitials}
                    </div>
                    <span className="text-sm font-semibold text-ink-900">
                      {requesterName}
                    </span>
                    <span className="rounded bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                      {await t('Initial request')}
                    </span>
                    <span className="text-ink-300">·</span>
                    <span className="text-[11px] tabular-nums text-ink-400">
                      {createdOnLabel}
                    </span>
                  </div>
                  <div className="mt-3">
                    <RichTextViewer content={ticket.description} />
                  </div>
                </div>
              )}

              {isCommentEnabled({
                subapp: SUBAPP_CODES.ticketing,
                config,
              }) && (
                <Comments
                  key={ticket.id}
                  variant="conversation"
                  inputPosition="bottom"
                  recordId={ticket.id}
                  subapp={SUBAPP_CODES.ticketing}
                  sortBy={SORT_TYPE.old}
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
              )}
            </div>

            {/* Right — sidebar */}
            <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
              <TicketSidebar
                categories={categories}
                priorities={priorities}
                contacts={contacts}
                formFields={clone(config.ticketingFormFieldSet)}
                showAssignment={config.isDisplayAssignmentBtn}
              />

              <div
                className={cn(
                  'space-y-4 rounded-xl border border-ink-100 bg-white shadow-xs p-5',
                  {
                    ['hidden']:
                      !config.isDisplayTicketParent &&
                      !config.isDisplayChildTicket &&
                      !config.isDisplayRelatedTicket,
                  },
                )}>
                <h3 className="text-sm font-bold uppercase tracking-[0.06em] text-ink-400">
                  {await t('Related tickets')}
                </h3>
                {config.isDisplayTicketParent && (
                  <Suspense fallback={<Skeleton className="h-[120px]" />}>
                    <ParentTicket
                      ticketId={ticket.id}
                      projectId={ticket.project?.id}
                      client={client}
                      fields={config.ticketingFieldSet}
                    />
                  </Suspense>
                )}
                {config.isDisplayChildTicket && (
                  <Suspense fallback={<Skeleton className="h-[120px]" />}>
                    <ChildTickets
                      projectId={ticket.project?.id}
                      ticketId={ticket.id}
                      categories={categories}
                      priorities={priorities}
                      contacts={contacts}
                      userId={user.id}
                      client={client}
                      fields={config.ticketingFieldSet}
                      formFields={config.ticketingFormFieldSet}
                    />
                  </Suspense>
                )}
                {config.isDisplayRelatedTicket && (
                  <Suspense fallback={<Skeleton className="h-[120px]" />}>
                    <RelatedTickets
                      ticketId={ticket.id}
                      projectId={ticket.project?.id}
                      client={client}
                      fields={config.ticketingFieldSet}
                    />
                  </Suspense>
                )}
              </div>
            </aside>
          </div>
        </div>
      </TicketDetailsProvider>
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
  fields: TicketingConfig['ticketingFieldSet'];
  formFields: TicketingConfig['ticketingFormFieldSet'];
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
  fields: TicketingConfig['ticketingFieldSet'];
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
  fields: TicketingConfig['ticketingFieldSet'];
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
