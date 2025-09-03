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
  const {userId, isContact, workspaceId} = props;
  const where: WhereOptions<AOSProject> = {
    OR: [{archived: false}, {archived: null}],
    isBusinessProject: true,
    projectStatus: {isCompleted: false},
    portalWorkspace: {id: workspaceId},
    ...(isContact
      ? {clientPartner: {mainPartnerContacts: {id: userId}}}
      : {clientPartner: {id: userId}}),
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
      {createdByContact: {id: props.userId}},
      {managedByContact: {id: props.userId}},
    ],
  };
  return where;
}

export function withTicketAccessFilter(props: AuthProps) {
  const {isContact, role, isContactAdmin} = props;
  const isRestricted = isContact && !isContactAdmin && role != ROLE.TOTAL;
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
