import {MouseEvent, ReactNode, useMemo} from 'react';
import {MdArrowDropDown, MdArrowDropUp} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {ORDER_BY} from '@/constants';
import {i18n} from '@/locale';
import {TableHead} from '@/ui/components';
import {useResponsive} from '@/ui/hooks';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import type {Column} from './types';

type TableHeadsProps<T extends Record<string, any>> = {
  columns: Column<T>[];
  sort?: {
    key: string | null;
    direction: 'ASC' | 'DESC';
    toggle: (column: Column<T>, e: MouseEvent<HTMLTableCellElement>) => void;
  };
};

export function TableHeads<T extends Record<string, any>>(
  props: TableHeadsProps<T>,
) {
  const {columns, sort} = props;
  const res = useResponsive();
  const small = (['xs', 'sm', 'md'] as const).some(x => res[x]);

  const mainColumns = useMemo(
    () => (small ? columns.filter(c => c.mobile) : columns),
    [small, columns],
  );

  return mainColumns.map(column => {
    let icon: ReactNode;
    let handleClick;
    if (sort) {
      const isActive = sort?.key === column.key;
      const isASC = isActive && sort.direction === ORDER_BY.ASC;
      const Arrow = isASC ? MdArrowDropDown : MdArrowDropUp;
      const SortIcon = isActive ? Arrow : 'span';
      icon = <SortIcon className="h-4 w-4 ms-auto" />;
      handleClick = (e: MouseEvent<HTMLTableCellElement>) =>
        sort.toggle(column, e);
    }
    return (
      <TableHead
        key={column.key}
        onClick={handleClick}
        className={cn(
          'text-card-foreground text-xs font-semibold border-none p-3',
          {['cursor-pointer']: Boolean(sort)},
        )}>
        <div className="flex gap-1 items-center">
          <div className="line-clamp-1 min-w-fit">{i18n.t(column.label)}</div>
          {icon}
        </div>
      </TableHead>
    );
  });
}
