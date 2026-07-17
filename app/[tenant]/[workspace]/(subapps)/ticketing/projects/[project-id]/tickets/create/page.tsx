import {notFound, redirect, unauthorized} from 'next/navigation';
import {FaChevronRight} from 'react-icons/fa';

// ---- CORE IMPORTS ---- //
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {getTicketingConfig} from '../../../../common/orm/config';
import {t} from '@/locale/server';
import {clone} from '@/utils';
import {getCurrentPath} from '@/utils/current-path';
import {encodeFilter, getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components';
import {ALL_TICKETS_TITLE} from '../../../../common/constants';
import {
  findMainPartnerContacts,
  findProject,
  findTicketCategories,
  findTicketPriorities,
  findTicketStatuses,
} from '../../../../common/orm/projects';
import {findTicketAccess} from '../../../../common/orm/tickets';
import type {EncodedTicketFilter} from '../../../../common/utils/validators';
import {Form} from './client-form';

export default async function Page(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    'project-id': string;
  }>;
  searchParams: Promise<{
    parentId?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const projectId = params['project-id'];
  const {parentId} = searchParams;
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

  if (parentId) {
    const parentTicket = await findTicketAccess({
      recordId: parentId,
      select: {project: {id: true}},
      client,
      user,
      subapp,
      workspace: access.workspace,
    });
    if (parentTicket?.project?.id !== projectId) notFound();
  }

  const [project, statuses, categories, priorities, contacts] =
    await Promise.all([
      findProject({projectId, client, user, workspace: access.workspace}),
      findTicketStatuses(projectId, client),
      findTicketCategories(projectId, client).then(clone),
      findTicketPriorities(projectId, client).then(clone),
      findMainPartnerContacts(projectId, client).then(clone),
    ]);

  if (!project) notFound();

  const ticketsURL = `${workspaceURI}/ticketing/projects/${projectId}/tickets`;
  const status = statuses.filter(s => !s.isCompleted).map(s => s.id);
  const allTicketsURL = `${ticketsURL}?filter=${encodeFilter<EncodedTicketFilter>({status})}&title=${encodeURIComponent(ALL_TICKETS_TITLE)}`;

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container py-6 space-y-5 max-w-4xl">
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
                className="text-ink-500 cursor-pointer max-w-[8ch] md:max-w-[35ch] truncate text-sm">
                <Link href={`${workspaceURI}/ticketing/projects/${projectId}`}>
                  {project.name}
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
                <Link href={allTicketsURL}>{await t(ALL_TICKETS_TITLE)}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <FaChevronRight className="text-ink-300" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate text-sm text-ink-700 font-medium">
                {await t('Create a ticket')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
            {await t('Support')}
          </p>
          <h1 className="text-3xl font-bold text-ink-900 tracking-[-0.01em]">
            {await t('Create a ticket')}
          </h1>
          <p className="text-sm text-ink-500 mt-2">
            {await t('Describe your request to open a new support ticket.')}
          </p>
        </header>
        <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-6">
          <Form
            projectId={projectId}
            categories={categories}
            priorities={priorities}
            contacts={contacts}
            userId={user.id}
            parentId={parentId}
            workspaceURI={workspaceURI}
            formFields={clone(config.ticketingFormFieldSet)}
          />
        </div>
      </div>
    </div>
  );
}
