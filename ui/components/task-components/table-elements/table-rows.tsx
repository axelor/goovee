// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Collapsible,
  CollapsibleContent,
  TableCell,
  TableRow,
} from '@/ui/components';
import {useResponsive} from '@/ui/hooks';
import {Fragment, MouseEvent, ReactNode, useMemo, useState} from 'react';
import {MdArrowDropDown, MdArrowDropUp} from 'react-icons/md';

// ---- LOCAL IMPORTS ---- //
import type {Column} from './types';

type TableRowsProps<T extends Record<string, any>> = {
  records: T[];
  columns: Column<T>[];
  onRowClick?: (record: T, e: MouseEvent<HTMLTableRowElement>) => void;
  deleteCellRenderer?: (record: T) => ReactNode;
};

export function TableRows<T extends Record<string, any>>(
  props: TableRowsProps<T>,
) {
  const {records, columns, deleteCellRenderer, onRowClick} = props;
  const [openId, setOpenId] = useState<string | null>(null);

  const res = useResponsive();
  const small = (['xs', 'sm', 'md'] as const).some(x => res[x]);
  const [mainColumns, subColumns] = useMemo(
    () =>
      small
        ? [columns.filter(c => c.mobile), columns.filter(c => !c.mobile)]
        : [columns, []],
    [small, columns],
  );

  if (!records.length) {
    return (
      <TableRow>
        <TableCell colSpan={columns.length + 1} align="center">
          {i18n.t('No records found')}
        </TableCell>
      </TableRow>
    );
  }

  return records.map(record => {
    const open = openId === record.id;
    const Arrow = open ? MdArrowDropUp : MdArrowDropDown;

    const handleClick = (e: MouseEvent<HTMLTableRowElement>) => {
      onRowClick?.(record, e);
    };

    const handleToggle = (e: MouseEvent<HTMLTableCellElement>) => {
      e.stopPropagation();
      setOpenId(open ? null : record.id);
    };

    return (
      <Fragment key={record.id}>
        <TableRow
          onClick={handleClick}
          className="cursor-pointer [&:not(:has(.action:hover)):hover]:bg-slate-100 text-sm">
          {mainColumns.map(column => (
            <TableCell key={column.key} className="p-3">
              {column.content(record)}
            </TableCell>
          ))}
          {small && !!subColumns.length && (
            <TableCell
              className="p-3 action text-center w-16"
              onClick={handleToggle}>
              <Arrow className="cursor-pointer inline" />
            </TableCell>
          )}
          {deleteCellRenderer && (
            <TableCell className="text-center action pointer-events-none p-3 w-16">
              {deleteCellRenderer(record)}
            </TableCell>
          )}
        </TableRow>
        {small && !!subColumns.length && (
          <Collapsible open={open} asChild>
            <TableRow className="text-xs">
              <CollapsibleContent asChild>
                <TableCell colSpan={mainColumns.length + 2}>
                  <div className="grid grid-cols-2 gap-y-2 auto-rows-fr items-center">
                    {subColumns.map(column => (
                      <Item key={column.key} label={column.label}>
                        {column.content(record)}
                      </Item>
                    ))}
                  </div>
                </TableCell>
              </CollapsibleContent>
            </TableRow>
          </Collapsible>
        )}
      </Fragment>
    );
  });
}

type ItemProps = {
  label: ReactNode;
  children: ReactNode;
};

function Item({label, children}: ItemProps) {
  return (
    <>
      <p className="text-xs font-semibold mb-0">{label}</p>
      <p className="flex justify-self-end items-center">{children}</p>
    </>
  );
}
