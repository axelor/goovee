import {ORDER_BY} from '@/constants';
import type {AOSProjectTask} from '@/goovee/.generated/models';
import type {Maybe} from '@/types/util';
import type {ID, WhereOptions} from '@goovee/orm';
import {set} from 'lodash';
import {COMPANY} from '../constants';
import {EncodedTicketFilterSchema} from '../utils/validators';
import type {Where} from '@/types/orm';
import {getDateFilter} from '@/utils/orm';

export function getOrderBy(
  sort: Maybe<string>,
  sortMap: Record<string, string>,
) {
  if (!sort) return null;
  const [key, direction] = decodeSortValue(sort);
  if (!key) return null;
  const path = sortMap[key];
  if (!path) return null;
  const query = set({}, path, direction);
  return query;
}

export function getTicketWhere(
  filter: unknown,
  userId: ID,
): WhereOptions<AOSProjectTask> | null {
  if (!filter) return null;
  const {success, data} = EncodedTicketFilterSchema.safeParse(filter);
  if (!success || !data) return null;
  const {
    createdBy,
    status,
    priority,
    managedBy,
    updatedOn,
    myTickets,
    assignment,
    category,
    taskDate,
  } = data;

  const where: Where<AOSProjectTask> = {
    ...(status && {status: {id: {in: status}}}),
    ...(priority && {priority: {id: {in: priority}}}),
    ...(category && {projectTaskCategory: {id: {in: category}}}),
    ...(updatedOn && {updatedOn: getDateFilter(updatedOn)}),
    ...(taskDate && {taskDate: getDateFilter(taskDate)}),
    ...(assignment && {assignment}),
  };

  if (myTickets) {
    const OR = [
      {managedByContact: {id: userId}},
      {createdByContact: {id: userId}},
    ];
    if (where.OR) where.OR.push(...OR);
    else where.OR = OR;
    return where;
  }

  if (createdBy) {
    if (createdBy.includes(COMPANY)) {
      const filteredCreatedBy = createdBy.filter(id => id !== COMPANY);
      if (filteredCreatedBy.length) {
        const OR = [
          {createdByContact: {id: {in: filteredCreatedBy}}},
          {createdByContact: {id: null}},
        ];

        if (where.OR) where.OR.push(...OR);
        else where.OR = OR;
      } else {
        where.createdByContact = {id: null};
      }
    } else {
      where.createdByContact = {id: {in: createdBy}};
    }
  }

  if (managedBy) {
    where.managedByContact = {id: {in: managedBy}};
  }

  return where;
}

export const getSkip = (
  limit: string | number,
  page: string | number,
): number => {
  page = +page || 1;
  return (page - 1) * +limit;
};

const SEPARATOR = ' ';

export function decodeSortValue(
  sort: Maybe<string>,
): [string | null, 'ASC' | 'DESC'] {
  if (!sort) return [null, ORDER_BY.ASC];
  const [key, _direction] = sort.split(SEPARATOR, 2);
  const direction = _direction === ORDER_BY.DESC ? ORDER_BY.DESC : ORDER_BY.ASC; // take ascending as defualt direction
  return [key, direction];
}

export function encodeSortValue(
  key: string,
  direction: 'ASC' | 'DESC' = 'ASC',
): string {
  return [key, direction].join(SEPARATOR);
}
