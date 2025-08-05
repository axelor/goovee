import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {FaChevronRight} from 'react-icons/fa';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {clone} from '@/utils';
import {encodeFilter, getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';

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
import {findProject} from '../../../../common/orm/projects';
import {findTaskCategories} from '@/orm/project-task';
import {findTaskPriorities} from '@/orm/project-task';
import {findTaskStatuses} from '@/orm/project-task';
import {findProjectMainPartnerContacts} from '@/orm/project-task';
import {findTicketAccess} from '../../../../common/orm/tickets';
import {ensureAuth} from '../../../../common/utils/auth-helper';
import {EncodedFilter} from '../../../../common/utils/validators';
import {Form} from './client-form';

export default async function Page({
  params,
  searchParams,
}: {
  params: {
    tenant: string;
    workspace: string;
    'project-id': string;
  };
  searchParams: {
    parentId?: string;
  };
}) {
  const projectId = params['project-id'];
  const {parentId} = searchParams;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);
  const {error, auth, forceLogin} = await ensureAuth(workspaceURL, tenant);
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.ticketing}/projects/${projectId}/tickets/create?${new URLSearchParams(searchParams).toString()}`,
        workspaceURI,
        tenant,
      }),
    );
  }

  if (error) notFound();
  const {workspace} = auth;

  if (parentId) {
    const parentTicket = await findTicketAccess({
      recordId: parentId,
      select: {project: {id: true}},
      auth,
    });
    if (parentTicket?.project?.id !== projectId) notFound();
  }

  const [project, statuses, categories, priorities, contacts] =
    await Promise.all([
      findProject(projectId, auth),
      findTaskStatuses(projectId, tenant),
      findTaskCategories(projectId, tenant).then(clone),
      findTaskPriorities(projectId, tenant).then(clone),
      findProjectMainPartnerContacts({
        projectId,
        tenantId: tenant,
        appCode: SUBAPP_CODES.ticketing,
      }).then(clone),
    ]);

  if (!project) notFound();

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
              className="cursor-pointer max-w-[8ch] md:max-w-[35ch] truncate text-md">
              <Link href={`${workspaceURI}/ticketing/projects/${projectId}`}>
                {project.name}
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
              <h2 className="font-semibold text-xl">
                {await t('Create a ticket')}
              </h2>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Form
        projectId={projectId}
        categories={categories}
        priorities={priorities}
        contacts={contacts}
        userId={auth.user.id}
        parentId={parentId}
        workspaceURI={workspaceURI}
        formFields={clone(workspace.config.ticketingFormFieldSet)}
      />
    </div>
  );
}
