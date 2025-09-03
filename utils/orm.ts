import {Entity, WhereOptions} from '@goovee/orm';
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
