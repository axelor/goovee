// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import {manager, type Tenant} from '@/tenant';
import type {AOSProject} from '@/goovee/.generated/models';
import type {ID} from '@goovee/orm';

import type {QueryProps} from './helpers';
import type {AuthProps} from '@/orm/project-task';
import {getProjectAccessFilter} from '@/orm/project-task';
import {getAllTicketCount} from './tickets';
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
