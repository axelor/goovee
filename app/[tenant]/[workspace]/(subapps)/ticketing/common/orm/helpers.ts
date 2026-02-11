import {ROLE} from '@/constants';
import type {AOSProject, AOSProjectTask} from '@/goovee/.generated/models';
import type {Entity, OrderByArg, WhereOptions} from '@goovee/orm';
import {TYPE_SELECT} from '../constants';
import {AuthProps} from '../utils/auth-helper';
import {and} from '@/utils/orm';

export type QueryProps<T extends Entity> = {
  where?: WhereOptions<T> | null;
  take?: number;
  orderBy?: OrderByArg<T> | null;
  skip?: number;
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
    {typeSelect: TYPE_SELECT.TICKET},
    {OR: [{archived: false}, {archived: null}]},
    {OR: [{isPrivate: false}, {isPrivate: null}]},
    {OR: [{isInternal: false}, {isInternal: null}]},
  ]);
  return where;
}

export function getRestrictedTicketAccessFilter(props: AuthProps) {
  const where: WhereOptions<AOSProjectTask> = {
    OR: [
      {createdByContact: {id: props.user.id}},
      {managedByContact: {id: props.user.id}},
    ],
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
