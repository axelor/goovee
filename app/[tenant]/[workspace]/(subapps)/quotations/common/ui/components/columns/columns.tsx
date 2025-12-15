'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Chip} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {getStatus} from '@/subapps/quotations/common/utils/quotations';
import {formatDate} from '@/lib/core/locale/formatters';

export const Columns = [
  {
    key: 'saleOrderSeq',
    label: i18n.t('Quotation number'),
    sortable: true,
    mobile: true,
    getter: (row: any) => row.saleOrderSeq,
    content: (row: any) => (
      <span className="font-medium">
        {i18n.t('Sale quotation')} {row.saleOrderSeq}
        {row.externalReference && ` ( ${row.externalReference} )`}
      </span>
    ),
  },
  {
    key: 'statusSelect',
    label: i18n.t('Status'),
    getter: (row: any) => row.statusSelect,
    content: (row: any) => {
      const {status, variant} = getStatus(row.statusSelect);
      return (
        <Chip
          value={i18n.t(status)}
          className="font-normal text-[0.625rem]"
          variant={variant}
        />
      );
    },
  },
  {
    key: 'createdOn',
    label: i18n.t('Created on'),
    sortable: true,
    getter: (row: any) => row.createdOn,
    content: (row: any) => formatDate(row.createdOn),
  },
];
