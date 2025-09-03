// ---- CORE IMPORTS ---- //
import {ORDER_BY, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {manager, type Tenant} from '@/tenant';
import type {AOSProject} from '@/goovee/.generated/models';
import type {ID} from '@goovee/orm';

import type {QueryProps} from './helpers';
import type {AuthProps} from '../utils/auth-helper';
import {getProjectAccessFilter} from './helpers';
import {getAllTicketCount} from './tickets';
import {
  Category,
  ClientPartner,
  Company,
  ContactPartner,
  Priority,
  Status,
} from '../types';
import {and} from '@/utils/orm';

export async function findProjects(
  props: QueryProps<AOSProject> & {auth: AuthProps},
) {
  const {where, take, orderBy, skip, auth} = props;

  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(auth.tenantId);

  const projects = await client.aOSProject.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: and<AOSProject>([getProjectAccessFilter(auth), where]),
    select: {name: true},
  });

  return projects;
}

export async function findProjectsWithTaskCount(
  props: QueryProps<AOSProject> & {auth: AuthProps},
) {
  const projects = await findProjects(props);

  const counts = await Promise.all(
    projects.map(project =>
      getAllTicketCount({projectId: project.id, auth: props.auth}),
    ),
  );

  return projects.map((p, i) => ({...p, taskCount: counts[i]}));
}

export async function findProject(id: ID, auth: AuthProps) {
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(auth.tenantId);

  const project = await client.aOSProject.findOne({
    where: {
      id: id,
      ...getProjectAccessFilter(auth),
    },
    select: {id: true, name: true},
  });

  return project;
}

export async function findTicketCategories(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<Category[]> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

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

export async function findTicketPriorities(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<Priority[]> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

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

export async function findTicketStatuses(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<Status[]> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

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

export async function findCompany(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<Company | undefined> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(tenantId);

  const project = await client.aOSProject.findOne({
    where: {id: projectId},
    select: {company: {id: true, name: true}},
  });

  return project?.company;
}

export async function findClientPartner(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<ClientPartner | undefined> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(tenantId);

  const project = await client.aOSProject.findOne({
    where: {id: projectId},
    select: {
      clientPartner: {simpleFullName: true},
    },
  });

  return project?.clientPartner;
}

export async function findTicketDoneStatus(
  tenantId: Tenant['id'],
): Promise<string | undefined> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(tenantId);

  const projectAppConfig = await client.aOSAppProject.findOne({
    select: {completedTaskStatus: {id: true}},
  });

  return projectAppConfig?.completedTaskStatus?.id;
}

export async function findTicketCancelledStatus(
  tenantId: Tenant['id'],
): Promise<string | undefined> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(tenantId);

  const projectAppConfig = await client.aOSAppProject.findOne({
    select: {cancelledTaskStatus: {id: true}},
  });

  return projectAppConfig?.cancelledTaskStatus?.id;
}

export async function findMainPartnerContacts(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<ContactPartner[]> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

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
                {
                  contactAppPermissionList: {
                    app: {code: SUBAPP_CODES.ticketing},
                  },
                },
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
