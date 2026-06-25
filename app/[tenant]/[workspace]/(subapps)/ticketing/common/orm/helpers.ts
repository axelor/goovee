import {ROLE} from '@/constants';
import type {AOSProject, AOSProjectTask} from '@/goovee/.generated/models';
import type {Entity, OrderByArg, WhereOptions} from '@goovee/orm';
import type {User} from '@/types';
import type {Subapp, WorkspaceLight} from '@/orm/workspace';
import {TYPE_SELECT} from '../constants';
import {and} from '@/utils/orm';

export type QueryProps<T extends Entity> = {
  where?: WhereOptions<T> | null;
  take?: number;
  orderBy?: OrderByArg<T> | null;
  skip?: number;
};

export type UserCtx = Pick<User, 'id' | 'isContact' | 'simpleFullName'>;
export type SubappCtx = Pick<Subapp, 'isContactAdmin' | 'role'>;
export type WorkspaceCtx = Pick<WorkspaceLight, 'id'>;

export function getProjectAccessFilter({
  user,
  workspace,
}: {
  user: UserCtx;
  workspace: WorkspaceCtx;
}) {
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
    {typeSelect: TYPE_SELECT.TICKET},
    {OR: [{archived: false}, {archived: null}]},
    {OR: [{isPrivate: false}, {isPrivate: null}]},
    {OR: [{isInternal: false}, {isInternal: null}]},
  ]);
  return where;
}

export function getRestrictedTicketAccessFilter({user}: {user: UserCtx}) {
  const where: WhereOptions<AOSProjectTask> = {
    OR: [{createdByContact: {id: user.id}}, {managedByContact: {id: user.id}}],
  };
  return where;
}

export function withTicketAccessFilter({
  user,
  subapp,
}: {
  user: UserCtx;
  subapp: SubappCtx;
}) {
  const isRestricted =
    user.isContact && !subapp.isContactAdmin && subapp.role != ROLE.TOTAL;
  return function (where?: WhereOptions<AOSProjectTask>) {
    if (isRestricted) {
      return and<AOSProjectTask>([
        where,
        getTicketAccessFilter(),
        getRestrictedTicketAccessFilter({user}),
      ]);
    }
    return and<AOSProjectTask>([where, getTicketAccessFilter()]);
  };
}
