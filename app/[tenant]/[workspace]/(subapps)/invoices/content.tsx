'use client';

import {useMemo} from 'react';
import type {Cloned} from '@/types/util';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {Container, NavView, TableList, AlertToast} from '@/ui/components';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useSortBy} from '@/ui/hooks';
import {SUBAPP_CODES, URL_PARAMS} from '@/constants';
import type {PageInfo} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {
  INVOICE_TAB_ITEMS,
  HEADING,
  INVOICE,
  INVOICE_PAYMENT_OPTIONS,
} from '@/subapps/invoices/common/constants/invoices';
import {Columns, UnpaidColumns} from '@/subapps/invoices/common/ui/components';
import type {InvoicesConfig} from '@/subapps/invoices/common/orm/config';
import type {InvoiceListItem} from '@/subapps/invoices/common/types/invoices';

export default function Content({
  invoices = [],
  pageInfo,
  config,
  invoiceType,
}: {
  invoices: InvoiceListItem[];
  pageInfo?: PageInfo;
  config: InvoicesConfig | Cloned<InvoicesConfig>;
  invoiceType: string;
}) {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();

  const [sortedInvoices, sortOrder, toggleSortOrder] = useSortBy(invoices);

  const handleTabChange = (e: {href?: string}) => {
    router.push(`${workspaceURI}/${SUBAPP_CODES.invoices}?type=${e.href}`);
  };

  const handleClick = (invoice: InvoiceListItem) =>
    router.push(`${workspaceURI}/${SUBAPP_CODES.invoices}/${invoice.id}`);

  const hasUpcomingInvoices = useMemo(() => {
    return invoices?.some(({isUnpaid}) => isUnpaid);
  }, [invoices]);

  const allowOnlinePayment = config.allowOnlinePaymentForEcommerce;
  const canPayInvoice = config.canPayInvoice;
  const paymentOptionSet = config.paymentOptionSet;

  const allowInvoicePayment = !!(
    allowOnlinePayment &&
    canPayInvoice !== INVOICE_PAYMENT_OPTIONS.NO &&
    paymentOptionSet?.length
  );

  const unpaidColumns = useMemo(
    () => UnpaidColumns(allowInvoicePayment),
    [allowInvoicePayment],
  );

  const invoiceColumns = useMemo(
    () =>
      new Map([
        [INVOICE.UNPAID, unpaidColumns],
        [INVOICE.PAID, Columns],
      ]),
    [unpaidColumns],
  );
  return (
    <Container title={i18n.t('Invoices')}>
      {invoiceType === INVOICE.UNPAID && (
        <AlertToast
          show={hasUpcomingInvoices}
          title={i18n.t(HEADING)}
          variant="info"
        />
      )}
      <NavView
        items={INVOICE_TAB_ITEMS}
        activeTab={
          INVOICE_TAB_ITEMS.find(item => item.href === invoiceType)!.id
        }
        onTabChange={handleTabChange}>
        <div className="flex flex-col gap-4">
          <TableList
            columns={invoiceColumns.get(invoiceType) ?? []}
            rows={sortedInvoices}
            sort={sortOrder}
            onSort={toggleSortOrder}
            onRowClick={handleClick}
            pageInfo={pageInfo}
            pageParamKey={URL_PARAMS.page}
          />
        </div>
      </NavView>
    </Container>
  );
}
