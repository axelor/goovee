// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Chip} from '@/ui/components';
import {formatDate} from '@/lib/core/locale/formatters';

// ---- LOCAL IMPORTS ---- //
import {getStatus} from '@/subapps/orders/common/utils/orders';

export const OrderColumns = [
  {
    key: 'saleOrderSeq',
    label: i18n.t('Order number'),
    sortable: true,
    mobile: true,
    getter: (row: any) => row.saleOrderSeq,
    content: (row: any) => (
      <span className="font-medium">{row.saleOrderSeq}</span>
    ),
  },
  {
    key: 'statusSelect',
    label: i18n.t('Status'),
    getter: (row: any) => row.statusSelect,
    content: (row: any) => {
      const {status, variant} = getStatus(row.statusSelect, row.deliveryState);
      return (
        <Chip
          className="font-normal text-[0.625rem]"
          value={i18n.t(status)}
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
  {
    key: 'exTaxTotal',
    label: i18n.t('Total WT'),
    getter: (row: any) => row.exTaxTotal,
    content: (row: any) => row.exTaxTotal,
  },
  {
    key: 'inTaxTotal',
    label: i18n.t('Total ATI'),
    getter: (row: any) => row.inTaxTotal,
    mobile: true,
    content: (row: any) => (
      <span className="font-medium">{row.inTaxTotal}</span>
    ),
  },
];
