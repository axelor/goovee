'use client';

import {useMemo, useState} from 'react';
import {Link} from '@/ui/components/link';
import type {Cloned} from '@/types/util';
import {useRouter, useSearchParams} from 'next/navigation';
import {
  MdChevronLeft,
  MdChevronRight,
  MdOutlineInbox,
  MdOutlineReceiptLong,
  MdSearch,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Button, StatusPill} from '@/ui/components';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES, URL_PARAMS} from '@/constants';
import type {PageInfo} from '@/types';
import {cn} from '@/utils/css';
import {formatDate} from '@/lib/core/locale/formatters';
import type {StatusKey} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {
  INVOICE_TAB_ITEMS,
  INVOICE_TYPE,
  INVOICE_PAYMENT_OPTIONS,
} from '@/subapps/invoices/common/constants/invoices';
import type {InvoicesConfig} from '@/subapps/invoices/common/orm/config';
import type {InvoiceListItem} from '@/subapps/invoices/common/types/invoices';
import {extractAmount} from '@/subapps/invoices/common/utils/invoices';

const TODAY = new Date();

function isOverdue(invoice: InvoiceListItem): boolean {
  if (!invoice?.isUnpaid || !invoice?.dueDate) return false;
  return new Date(invoice.dueDate) < TODAY;
}

function getInvoiceStatusKey(invoice: InvoiceListItem): StatusKey {
  if (!invoice.isUnpaid) return 'paid';
  if (isOverdue(invoice)) return 'overdue';
  const remaining = extractAmount(invoice.amountRemaining?.value);
  const total = extractAmount(invoice.inTaxTotal);
  if (remaining > 0 && remaining < total) return 'partial';
  return 'unpaid';
}

function getInvoiceStatusLabel(invoice: InvoiceListItem): string {
  if (!invoice.isUnpaid) return INVOICE_TYPE.PAID;
  if (isOverdue(invoice)) return 'Overdue';
  return INVOICE_TYPE.UNPAID;
}

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
  const searchParams = useSearchParams();
  const {workspaceURI} = useWorkspace();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(inv =>
      String(inv.invoiceId || '')
        .toLowerCase()
        .includes(q),
    );
  }, [invoices, query]);

  const [selectedId, setSelectedId] = useState<string | null>(
    () => filtered[0]?.id ?? invoices[0]?.id ?? null,
  );

  const selected = useMemo(
    () => filtered.find(i => i.id === selectedId) ?? filtered[0],
    [filtered, selectedId],
  );

  const setPage = (next: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set(URL_PARAMS.page, String(next));
    router.push(`?${sp.toString()}`);
  };

  const setTab = (href: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('type', href);
    sp.delete(URL_PARAMS.page);
    router.push(`?${sp.toString()}`);
  };

  const allowInvoicePayment = !!(
    config?.allowOnlinePaymentForEcommerce &&
    config?.canPayInvoice !== INVOICE_PAYMENT_OPTIONS.NO &&
    config?.paymentOptionSet?.length
  );

  return (
    <div className="bg-ink-25 flex-1 min-h-0 flex flex-col">
      <div className="border-b border-ink-100 bg-white shrink-0">
        <nav className="max-w-[1280px] mx-auto px-8 flex gap-8">
          {INVOICE_TAB_ITEMS.map(tab => {
            const isActive = tab.href === invoiceType;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.href)}
                className={cn(
                  'py-4 text-sm font-semibold border-b-2 -mb-px transition-colors',
                  isActive
                    ? 'border-royal text-ink-900'
                    : 'border-transparent text-ink-500 hover:text-ink-700',
                )}>
                {i18n.t(tab.title)}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="w-full max-w-[1280px] mx-auto px-8 py-6 flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 flex-1 min-h-0">
          {/* Left — list */}
          <aside className="flex flex-col gap-3 min-h-[480px] lg:min-h-0">
            <div className="bg-white rounded-xl border border-ink-100 shadow-xs flex flex-col overflow-hidden flex-1 min-h-0">
              <header className="px-5 pt-5 pb-3">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-lg font-bold text-ink-900">
                    {i18n.t('Invoices')}
                  </h2>
                  <span className="text-xs text-ink-400 tabular-nums">
                    {query
                      ? filtered.length
                      : Number(pageInfo?.count ?? filtered.length)}{' '}
                    {i18n.t('items')}
                  </span>
                </div>
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-royal text-base" />
                  <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={i18n.t('Search an invoice')}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-royal-pale/60 border border-royal-border text-sm placeholder:text-ink-400 outline-none focus:border-royal focus:bg-royal-pale focus:shadow-[0_0_0_3px_rgba(21,84,181,0.12)] transition"
                  />
                </div>
              </header>
              <ul className="flex-1 overflow-y-auto px-2 pb-2">
                {filtered.length === 0 ? (
                  <li className="py-10 text-center text-sm text-ink-400 flex flex-col items-center gap-2">
                    <MdOutlineInbox className="text-3xl text-ink-300" />
                    {i18n.t('No invoices found')}
                  </li>
                ) : (
                  filtered.map(inv => (
                    <InvoiceItem
                      key={inv.id}
                      invoice={inv}
                      selected={inv.id === selected?.id}
                      onSelect={() => setSelectedId(inv.id)}
                      onOpen={() =>
                        router.push(
                          `${workspaceURI}/${SUBAPP_CODES.invoices}/${inv.id}`,
                        )
                      }
                    />
                  ))
                )}
              </ul>
              {pageInfo && Number(pageInfo.pages) > 1 && (
                <footer className="px-4 py-3 border-t border-ink-100 flex items-center justify-between text-xs text-ink-500 tabular-nums">
                  <span>
                    {i18n.t('Page')} {pageInfo.page} / {pageInfo.pages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={!pageInfo.hasPrev}
                      onClick={() => setPage(Number(pageInfo.page) - 1)}
                      className="h-7 w-7 grid place-items-center rounded-md hover:bg-ink-50 disabled:opacity-40 disabled:hover:bg-transparent"
                      aria-label={i18n.t('Previous page')}>
                      <MdChevronLeft />
                    </button>
                    <button
                      type="button"
                      disabled={!pageInfo.hasNext}
                      onClick={() => setPage(Number(pageInfo.page) + 1)}
                      className="h-7 w-7 grid place-items-center rounded-md hover:bg-ink-50 disabled:opacity-40 disabled:hover:bg-transparent"
                      aria-label={i18n.t('Next page')}>
                      <MdChevronRight />
                    </button>
                  </div>
                </footer>
              )}
            </div>
          </aside>

          {/* Right — preview */}
          {selected ? (
            <InvoicePreview
              invoice={selected}
              detailHref={`${workspaceURI}/${SUBAPP_CODES.invoices}/${selected.id}`}
              allowInvoicePayment={allowInvoicePayment}
            />
          ) : (
            <div className="bg-white rounded-xl border border-ink-100 shadow-xs grid place-items-center min-h-[400px]">
              <div className="text-center">
                <MdOutlineReceiptLong className="text-5xl text-ink-300 mx-auto mb-2" />
                <p className="text-sm text-ink-400">
                  {i18n.t('Select an invoice to see its details')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Local building blocks ---- //

function InvoiceItem({
  invoice,
  selected,
  onSelect,
  onOpen,
}: {
  invoice: InvoiceListItem;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const statusKey = getInvoiceStatusKey(invoice);
  const statusLabel = getInvoiceStatusLabel(invoice);
  const overdue = isOverdue(invoice);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={onOpen}
        title={i18n.t('Double-click to open')}
        className={cn(
          'w-full text-left rounded-lg px-3 py-3 mb-1 transition-colors',
          'border border-transparent',
          selected ? 'bg-mint-50 border-mint-200' : 'hover:bg-ink-50',
        )}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-semibold text-sm text-ink-900 truncate">
            {invoice.invoiceId}
          </span>
          <StatusPill status={statusKey} size="sm">
            {i18n.t(statusLabel)}
          </StatusPill>
        </div>
        <div className="flex items-center justify-between text-xs tabular-nums">
          <span
            className={cn(
              overdue ? 'text-status-overdue-fg font-semibold' : 'text-ink-500',
            )}>
            {invoice.isUnpaid ? i18n.t('Due') : i18n.t('Paid')}{' '}
            {formatDate(
              invoice.isUnpaid ? invoice.dueDate : (invoice.invoiceDate ?? ''),
            )}
          </span>
          <span className="font-semibold text-ink-900">
            {invoice.isUnpaid
              ? invoice.amountRemaining?.formattedValue
              : invoice.inTaxTotal}
          </span>
        </div>
      </button>
    </li>
  );
}

function InvoicePreview({
  invoice,
  detailHref,
  allowInvoicePayment,
}: {
  invoice: InvoiceListItem;
  detailHref: string;
  allowInvoicePayment: boolean;
}) {
  const statusKey = getInvoiceStatusKey(invoice);
  const statusLabel = getInvoiceStatusLabel(invoice);
  const overdue = isOverdue(invoice);

  return (
    <section className="bg-white rounded-xl border border-ink-100 shadow-xs p-7 flex flex-col self-start">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">
              {i18n.t('Invoice')}
            </span>
            <StatusPill status={statusKey} size="sm">
              {i18n.t(statusLabel)}
            </StatusPill>
          </div>
          <h2 className="text-2xl font-bold text-ink-900 tabular-nums">
            {invoice.invoiceId}
          </h2>
        </div>
        <Button asChild variant="royal" size="sm">
          <Link href={detailHref}>{i18n.t('View details')}</Link>
        </Button>
      </div>

      <dl className="grid grid-cols-3 gap-6 text-sm mb-6">
        <PreviewField
          label={invoice.isUnpaid ? i18n.t('Due on') : i18n.t('Paid on')}
          value={formatDate(
            invoice.isUnpaid ? invoice.dueDate : (invoice.invoiceDate ?? ''),
          )}
          tone={overdue ? 'overdue' : undefined}
        />
        <PreviewField label={i18n.t('Total ATI')} value={invoice.inTaxTotal} />
        {invoice.isUnpaid && (
          <PreviewField
            label={i18n.t('Remaining')}
            value={invoice.amountRemaining?.formattedValue}
            emphasis
          />
        )}
      </dl>

      {invoice.isUnpaid && allowInvoicePayment && (
        <div className="mt-auto">
          <Button asChild variant="royal" className="w-full">
            <Link href={detailHref}>
              {i18n.t('Pay')} {invoice.amountRemaining?.formattedValue}
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}

function PreviewField({
  label,
  value,
  emphasis,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
  tone?: 'overdue';
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
        {label}
      </dt>
      <dd
        className={cn(
          'tabular-nums',
          tone === 'overdue' && 'text-status-overdue-fg font-semibold',
          emphasis && 'text-lg font-bold text-ink-900',
          !tone && !emphasis && 'text-sm text-ink-700',
        )}>
        {value}
      </dd>
    </div>
  );
}
