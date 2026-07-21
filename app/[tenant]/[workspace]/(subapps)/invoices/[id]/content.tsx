'use client';

import {useCallback, useMemo} from 'react';
import {Link} from '@/ui/components/link';
import type {Cloned} from '@/types/util';
import {useRouter} from 'next/navigation';
import {MdArrowBack, MdOutlineFileDownload} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Button, StatusPill} from '@/ui/components';
import {i18n} from '@/locale';
import {SUBAPP_CODES} from '@/constants';
import {cn} from '@/utils/css';
import {formatDate} from '@/lib/core/locale/formatters';
import {useToast} from '@/ui/hooks';
import type {StatusKey} from '@/ui/components';
import {
  PaymentUpdateStatus,
  PAYMENT_UPDATE_STATUS,
} from '@/lib/core/payment/sse/constants';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {Invoice, Total} from '@/subapps/invoices/common/ui/components';
import {INVOICE_TYPE} from '@/subapps/invoices/common/constants/invoices';
import type {InvoicesConfig} from '@/subapps/invoices/common/orm/config';
import type {Invoice as InvoiceType} from '@/subapps/invoices/common/types/invoices';
import {extractAmount} from '@/subapps/invoices/common/utils/invoices';

interface ContentProps {
  invoice: Cloned<InvoiceType>;
  config: InvoicesConfig | Cloned<InvoicesConfig>;
  workspaceURI: string;
  token?: string;
}

const TODAY = new Date();

function isOverdue(invoice: Cloned<InvoiceType>): boolean {
  if (!invoice?.isUnpaid || !invoice?.dueDate) return false;
  return new Date(invoice.dueDate) < TODAY;
}

function getInvoiceStatusKey(invoice: Cloned<InvoiceType>): StatusKey {
  if (!invoice.isUnpaid) return 'paid';
  if (isOverdue(invoice)) return 'overdue';
  const remaining = extractAmount(invoice.amountRemaining?.value);
  const total = extractAmount(invoice.inTaxTotal);
  if (remaining > 0 && remaining < total) return 'partial';
  return 'unpaid';
}

function getInvoiceTone(
  invoice: Cloned<InvoiceType>,
): 'mint' | 'overdue' | 'royal' {
  if (!invoice.isUnpaid) return 'mint';
  if (isOverdue(invoice)) return 'overdue';
  return 'royal';
}

export default function Content({
  invoice,
  config,
  workspaceURI,
  token,
}: ContentProps) {
  const {id, invoiceId, dueDate, invoiceDate, isUnpaid} = invoice;

  const router = useRouter();
  const {toast} = useToast();

  const invoiceType = isUnpaid ? INVOICE_TYPE.UNPAID : INVOICE_TYPE.PAID;
  const statusKey = getInvoiceStatusKey(invoice);
  const tone = getInvoiceTone(invoice);
  const overdue = isOverdue(invoice);

  const statusLabel = useMemo(() => {
    if (!isUnpaid) return INVOICE_TYPE.PAID;
    if (overdue) return 'Overdue';
    return INVOICE_TYPE.UNPAID;
  }, [isUnpaid, overdue]);

  const handlePaymentUpdate = useCallback(
    (status: PaymentUpdateStatus) => {
      router.refresh();
      if (status === PAYMENT_UPDATE_STATUS.SUCCESS) {
        toast({
          title: i18n.t('Payment completed successfully'),
          variant: 'success',
        });
      } else if (status === PAYMENT_UPDATE_STATUS.PARTIAL) {
        toast({
          title: i18n.t(
            'Partial payment received. Waiting for remaining funds.',
          ),
          variant: 'success',
        });
      } else if (status === PAYMENT_UPDATE_STATUS.CANCELLED) {
        toast({
          title: i18n.t('Payment cancelled.'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: i18n.t('Payment failed. Please try again.'),
          variant: 'destructive',
        });
      }
    },
    [router, toast],
  );

  return (
    <div className="bg-ink-25 flex-1 min-h-0 flex flex-col">
      <Hero
        eyebrow={i18n.t('Invoice')}
        title={invoiceId ?? ''}
        statusKey={statusKey}
        statusLabel={i18n.t(statusLabel)}
        tone={tone}
        meta={
          isUnpaid ? (
            <>
              {i18n.t('Due on')}{' '}
              <strong
                className={cn(
                  'tabular-nums',
                  overdue ? 'text-status-overdue-fg' : 'text-ink-900',
                )}>
                {formatDate(dueDate || '')}
              </strong>
            </>
          ) : (
            <>
              {i18n.t('Paid on')}{' '}
              <strong className="text-ink-900 tabular-nums">
                {formatDate(invoiceDate || '')}
              </strong>
            </>
          )
        }
        backHref={`${workspaceURI}/${SUBAPP_CODES.invoices}${token ? `?token=${token}` : ''}`}
        actions={
          <Button asChild variant="ink-outline" size="sm">
            <a
              href={withBasePath(
                `${workspaceURI}/${SUBAPP_CODES.invoices}/api/invoice/${id}${token ? `?token=${token}` : ''}`,
              )}>
              <MdOutlineFileDownload className="text-base mr-1" />
              {i18n.t('Download invoice')}
            </a>
          </Button>
        }
      />

      <div className="w-full max-w-[1280px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          {/* Left — PDF viewer wrapped in card chrome */}
          <div className="bg-white rounded-xl border border-ink-100 shadow-xs overflow-hidden">
            <Invoice
              invoiceId={id}
              downloadURL={withBasePath(
                `${workspaceURI}/${SUBAPP_CODES.invoices}/api/invoice/${id}${token ? `?token=${token}` : ''}`,
              )}
            />
          </div>

          {/* Right — payment card */}
          <div className="bg-white rounded-xl border border-ink-100 shadow-xs overflow-hidden">
            <Total
              invoice={invoice}
              invoiceType={invoiceType}
              isUnpaid={isUnpaid}
              config={config}
              workspaceURI={workspaceURI}
              token={token}
              onPaymentUpdate={handlePaymentUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Local building blocks ---- //

function Hero({
  eyebrow,
  title,
  statusKey,
  statusLabel,
  tone,
  meta,
  backHref,
  actions,
}: {
  eyebrow: string;
  title: string;
  statusKey: StatusKey;
  statusLabel: string;
  tone: 'mint' | 'overdue' | 'royal';
  meta: React.ReactNode;
  backHref: string;
  actions?: React.ReactNode;
}) {
  const gradient =
    tone === 'mint'
      ? 'bg-gradient-to-br from-mint-50 to-ink-25'
      : tone === 'overdue'
        ? 'bg-gradient-to-br from-status-overdue-bg to-ink-25'
        : 'bg-gradient-to-br from-royal-pale to-ink-25';
  const eyebrowColor =
    tone === 'mint'
      ? 'text-mint-700'
      : tone === 'overdue'
        ? 'text-status-overdue-fg'
        : 'text-royal';

  return (
    <div
      className={cn(
        'border-b border-ink-100 px-8 pt-6 pb-10 shrink-0',
        gradient,
      )}>
      <div className="max-w-[1280px] mx-auto">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-700 mb-6">
          <MdArrowBack className="text-sm" /> {i18n.t('Back')}
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span
                className={cn(
                  'text-xs font-semibold uppercase tracking-[0.06em]',
                  eyebrowColor,
                )}>
                {eyebrow}
              </span>
              <StatusPill status={statusKey}>{statusLabel}</StatusPill>
            </div>
            <h1 className="text-[44px] font-bold leading-none tracking-[-0.03em] text-ink-900 tabular-nums">
              {title}
            </h1>
            <div className="mt-3 text-sm text-ink-600">{meta}</div>
          </div>

          {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
