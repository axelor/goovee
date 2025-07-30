import {ORDER_BY, SUBAPP_CODES} from '@/constants';
import {type Tenant, manager} from '@/lib/core/tenant';
import type {ID} from '@goovee/orm';

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

export type ProjectMember = {
  id: string;
  version: number;
  fullName?: string;
};
export async function findProjectMembers(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<ProjectMember[]> {
  const client = await manager.getClient(tenantId);

  const project = await client.aOSProject.findOne({
    where: {id: projectId},
    select: {
      membersUserSet: {
        select: {id: true, fullName: true},
      },
    },
  });

  return project?.membersUserSet ?? [];
}
