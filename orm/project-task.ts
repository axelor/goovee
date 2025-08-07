import {
  INVOICE_CATEGORY,
  INVOICE_STATUS,
  ORDER_BY,
  ROLE,
  SUBAPP_CODES,
  TASK_TYPE_SELECT,
  TIMESHEET_STATUS,
} from '@/constants';
import type {
  AOSHRTimesheetLine,
  AOSInvoice,
  AOSProject,
  AOSProjectTask,
} from '@/goovee/.generated/models';
import {type Tenant, manager} from '@/lib/core/tenant';
import {
  type User,
  type Subapp,
  PartnerKey,
  type PortalWorkspace,
} from '@/types';
import {getWhereClauseForEntity} from '@/utils/filters';
import {and, or} from '@/utils/orm';
import type {ID, WhereOptions} from '@goovee/orm';
import {startOfYear} from 'date-fns';
import {AuthProps} from './project-task';

export type PortalWorkspaceWithConfig = Omit<PortalWorkspace, 'config'> &
  Required<Pick<PortalWorkspace, 'config'>>;

export type AuthProps = {
  user: User;
  subapp: Subapp;
  workspace: PortalWorkspaceWithConfig;
  workspaceURL: string;
  tenantId: Tenant['id'];
};

export function getProjectAccessFilter(props: AuthProps) {
  const {user, workspace} = props;
  const where: WhereOptions<AOSProject> = {
    OR: [{archived: false}, {archived: null}],
    isBusinessProject: true,
    projectStatus: {isCompleted: false},
    portalWorkspace: {id: workspace.id},
    ...(user.isContact
      ? {clientPartner: {mainPartnerContacts: {id: user.id}}}
      : {clientPartner: {id: user.id}}),
  };
  return where;
}

export function getTicketAccessFilter() {
  const where = and<AOSProjectTask>([
    {typeSelect: TASK_TYPE_SELECT.TICKET},
    {OR: [{archived: false}, {archived: null}]},
    {OR: [{isPrivate: false}, {isPrivate: null}]},
    {OR: [{isInternal: false}, {isInternal: null}]},
  ]);
  return where;
}

export function getRestrictedTicketAccessFilter(props: AuthProps) {
  const {user} = props;
  const where: WhereOptions<AOSProjectTask> = {
    OR: [{createdByContact: {id: user.id}}, {managedByContact: {id: user.id}}],
  };
  return where;
}

export function withTicketAccessFilter(props: AuthProps) {
  const {user, subapp} = props;
  const isRestricted =
    user.isContact && !subapp.isContactAdmin && subapp.role != ROLE.TOTAL;
  return function (where?: WhereOptions<AOSProjectTask>) {
    if (isRestricted) {
      return and<AOSProjectTask>([
        where,
        getTicketAccessFilter(),
        getRestrictedTicketAccessFilter(props),
      ]);
    }
    return and<AOSProjectTask>([where, getTicketAccessFilter()]);
  };
}

export function getTaskAccessFilter() {
  const where = and<AOSProjectTask>([
    {typeSelect: TASK_TYPE_SELECT.TASK},
    {OR: [{archived: false}, {archived: null}]},
    {OR: [{isPrivate: false}, {isPrivate: null}]},
    {OR: [{isInternal: false}, {isInternal: null}]},
  ]);
  return where;
}

export function getRestrictedTaskAccessFilter(props: AuthProps) {
  return undefined;
}

export function withTaskAccessFilter(props: AuthProps) {
  const {user, subapp} = props;
  const isRestricted =
    user.isContact && !subapp.isContactAdmin && subapp.role != ROLE.TOTAL;
  return function (where?: WhereOptions<AOSProjectTask>) {
    if (isRestricted) {
      return and<AOSProjectTask>([
        where,
        getTaskAccessFilter(),
        getRestrictedTaskAccessFilter(props),
      ]);
    }
    return and<AOSProjectTask>([where, getTaskAccessFilter()]);
  };
}

export function withTicketAndTaskAccessFilter(props: AuthProps) {
  return function (where?: WhereOptions<AOSProjectTask>) {
    return or<AOSProjectTask>([
      withTaskAccessFilter(props)(where),
      withTicketAccessFilter(props)(where),
    ]);
  };
}

export function getTimesheetLineAccessFilter({
  auth,
  typeSelect,
}: {
  auth: AuthProps;
  typeSelect?: TASK_TYPE_SELECT;
}) {
  const withAccessFilter =
    typeSelect === TASK_TYPE_SELECT.TICKET
      ? withTicketAccessFilter
      : typeSelect === TASK_TYPE_SELECT.TASK
        ? withTaskAccessFilter
        : withTicketAndTaskAccessFilter;

  const filter = {
    timesheet: {statusSelect: TIMESHEET_STATUS.VALIDATED},
    OR: [{projectTask: {id: null}}, {projectTask: withAccessFilter(auth)()}],
    customerDurationHours: {gt: 0},
  } satisfies WhereOptions<AOSHRTimesheetLine>;
  return filter;
}

export function getInvoiceAccessFilter(
  auth: Pick<AuthProps, 'subapp' | 'user'>,
) {
  const {user, subapp} = auth;
  return and<AOSInvoice>([
    getWhereClauseForEntity({
      user,
      role: subapp.role,
      isContactAdmin: subapp.isContactAdmin,
      partnerKey: PartnerKey.PARTNER,
    }),
    {
      OR: [{archived: false}, {archived: null}],
      statusSelect: INVOICE_STATUS.VENTILATED,
      operationTypeSelect: INVOICE_CATEGORY.SALE_INVOICE,
    },
  ]);
}

export type MainPartnerContact = {
  id: string;
  version: number;
  simpleFullName?: string;
};
export async function findProjectMainPartnerContacts({
  projectId,
  tenantId,
  appCode,
}: {
  projectId: ID;
  appCode: SUBAPP_CODES;
  tenantId: Tenant['id'];
}): Promise<MainPartnerContact[]> {
  const client = await manager.getClient(tenantId);

  const project = await client.aOSProject.findOne({
    where: {id: projectId},
    select: {
      clientPartner: {
        id: true,
        simpleFullName: true,
        isActivatedOnPortal: true,
        mainPartnerContacts: {
          where: {
            OR: [{archived: false}, {archived: null}],
            isActivatedOnPortal: true,
            contactWorkspaceConfigSet: {
              OR: [
                {isAdmin: true},
                {contactAppPermissionList: {app: {code: appCode}}},
              ],
            },
          },
          select: {simpleFullName: true},
        } as {select: {simpleFullName: true}}, // as typecast is to prevent orm by giving wrong type
      },
    },
  });

  if (!project?.clientPartner) return [];

  const partners =
    project.clientPartner.mainPartnerContacts?.map(p => ({
      id: p.id,
      version: p.version,
      simpleFullName: p.simpleFullName,
    })) ?? [];

  if (project.clientPartner.isActivatedOnPortal) {
    partners.push({
      id: project.clientPartner.id,
      version: project.clientPartner.version,
      simpleFullName: project.clientPartner.simpleFullName,
    });
  }

  return partners;
}

export type TaskStatus = {
  id: string;
  version: number;
  name?: string;
  sequence?: number;
  isCompleted?: boolean;
};

export async function findTaskStatuses(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<TaskStatus[]> {
  const client = await manager.getClient(tenantId);

  const project = await client.aOSProject.findOne({
    where: {id: projectId},
    select: {
      projectTaskStatusSet: {
        where: {OR: [{archived: false}, {archived: null}]},
        orderBy: {sequence: ORDER_BY.ASC},
        select: {id: true, name: true, sequence: true, isCompleted: true},
      } as {select: {id: true; name: true; sequence: true; isCompleted: true}},
    },
  });

  return project?.projectTaskStatusSet ?? [];
}

export type TaskPriority = {id: string; version: number; name?: string};
export async function findTaskPriorities(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<TaskPriority[]> {
  const client = await manager.getClient(tenantId);

  const project = await client.aOSProject.findOne({
    where: {id: projectId},
    select: {
      projectTaskPrioritySet: {
        where: {OR: [{archived: false}, {archived: null}]},
        select: {id: true, name: true},
      },
    },
  });

  return project?.projectTaskPrioritySet ?? [];
}

export type ProjectCompany = {id: string; version: number; name?: string};
export async function findProjectCompany(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<ProjectCompany | undefined> {
  const client = await manager.getClient(tenantId);

  const project = await client.aOSProject.findOne({
    where: {id: projectId},
    select: {company: {id: true, name: true}},
  });

  return project?.company;
}

export type ProjectClientPartner = {
  id: string;
  version: number;
  simpleFullName?: string;
};
export async function findProjectClientPartner(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<ProjectClientPartner | undefined> {
  const client = await manager.getClient(tenantId);

  const project = await client.aOSProject.findOne({
    where: {id: projectId},
    select: {
      clientPartner: {simpleFullName: true},
    },
  });

  return project?.clientPartner;
}

export type TaskCategory = {id: string; version: number; name?: string};
export async function findTaskCategories(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<TaskCategory[]> {
  const client = await manager.getClient(tenantId);

  const project = await client.aOSProject.findOne({
    where: {id: projectId},
    select: {
      projectTaskCategorySet: {
        where: {OR: [{archived: false}, {archived: null}]},
        select: {id: true, name: true},
      },
    },
  });

  return project?.projectTaskCategorySet ?? [];
}

export type ProjectMemberEmployee = {
  id: string;
  version: number;
  name?: string;
};
export async function findProjectMemberEmployees(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<ProjectMemberEmployee[]> {
  const client = await manager.getClient(tenantId);

  const project = await client.aOSProject.findOne({
    where: {id: projectId},
    select: {
      membersUserSet: {
        select: {
          employee: {name: true},
        },
      },
    },
  });

  return (
    project?.membersUserSet?.map(user => user.employee!).filter(Boolean) ?? []
  );
}
export async function getTotalTimeSpent(props: {
  projectId: ID;
  taskId?: ID;
  auth: AuthProps;
  typeSelect?: TASK_TYPE_SELECT;
}): Promise<number> {
  const {projectId, taskId, auth, typeSelect} = props;

  const client = await manager.getClient(auth.tenantId);

  //NOTE: ORM is ignoring decimal values
  // const res = await client.aOSHRTimesheetLine.aggregate({
  //   where: and<AOSHRTimesheetLine>([
  //     getTimesheetLineAccessFilter({auth, typeSelect}),
  //     {project: {id: projectId}},
  //     auth.workspace.config.isResetValuesOnYearStart && {
  //       date: {ge: startOfYear(new Date())},
  //     },
  //   ]),
  //   sum: {customerDurationHours: true},
  // });
  const lines = await client.aOSHRTimesheetLine.find({
    where: and<AOSHRTimesheetLine>([
      getTimesheetLineAccessFilter({auth, typeSelect}),
      {project: {id: projectId}},
      taskId && {projectTask: {id: taskId}},
      auth.workspace.config.isResetValuesOnYearStart && {
        date: {ge: startOfYear(new Date())},
      },
    ]),
    select: {customerDurationHours: true},
  });
  return lines.reduce(
    (acc, line) => acc + (line.customerDurationHours?.toNumber() || 0),
    0,
  );
}
