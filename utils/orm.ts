import type {Entity, WhereOptions, DateFilter} from '@goovee/orm';
import {isEmpty} from 'lodash';

export function and<T extends Entity>(
  filters: (WhereOptions<T> | undefined | 0 | null | '' | false)[],
): {AND: WhereOptions<T>[]} | undefined {
  const filtered = filters
    .filter(Boolean)
    .filter(f => !isEmpty(f)) as WhereOptions<T>[];
  if (filtered.length === 0) return;
  return {AND: filtered};
}

export function or<T extends Entity>(
  filters: (WhereOptions<T> | undefined | 0 | null | '' | false)[],
): {OR: WhereOptions<T>[]} | undefined {
  const filtered = filters
    .filter(Boolean)
    .filter(f => !isEmpty(f)) as WhereOptions<T>[];
  if (filtered.length === 0) return;
  return {OR: filtered};
}

export function getDateFilter(
  dates: [string | undefined, string | undefined],
): DateFilter | null {
  const startDate = dates[0];
  const endDate = dates[1];
  if (startDate && endDate) return {between: [startDate, endDate]};
  if (startDate) return {ge: startDate};
  if (endDate) return {le: endDate};
  return null;
}
