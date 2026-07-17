'use client';

import {Link} from '@/ui/components/link';
import Image from 'next/image';
import {MdArrowBack, MdOutlineFileDownload} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Button, StatusPill, StatusTimeline} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {getCityName} from '@/utils';
import {getProductImageURL} from '@/utils/files';
import {formatDate} from '@/lib/core/locale/formatters';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {
  CUSTOMER_DELIVERY,
  DOWNLOAD_PDF,
  INVOICE,
} from '@/subapps/orders/common/constants/orders';
import {
  getStatus,
  getStatusKey,
  getOrderJourney,
} from '@/subapps/orders/common/utils/orders';
import type {DetailOrder} from '@/subapps/orders/common/types/orders';

const Content = ({order}: {order: DetailOrder}) => {
  const {
    saleOrderSeq,
    exTaxTotal,
    inTaxTotal,
    createdOn,
    shipmentMode,
    statusSelect,
    deliveryState,
    mainInvoicingAddress,
    deliveryAddress,
    saleOrderLineList = [],
    totalDiscount,
    id,
    invoices = [],
    customerDeliveries = [],
    orderReport,
  } = order;

  const {status} = getStatus(statusSelect, deliveryState);
  const statusKey = getStatusKey(statusSelect, deliveryState);
  const journey = getOrderJourney(statusSelect, deliveryState, {
    orderedAt: createdOn ? formatDate(createdOn) : undefined,
    confirmedAt: createdOn ? formatDate(createdOn) : undefined,
    deliveredAt: undefined,
  });

  const {workspaceURI, tenant} = useWorkspace();

  const hideDiscount = saleOrderLineList?.every(
    item => parseFloat(String(item.discountAmount)) === 0,
  );
  const isDelivered = statusKey === 'delivered';
  const lineCount = saleOrderLineList?.length ?? 0;

  return (
    <div className="bg-ink-25 min-h-full">
      <Hero
        eyebrow={i18n.t('Order')}
        title={saleOrderSeq ?? ''}
        statusKey={statusKey}
        statusLabel={i18n.t(status)}
        tone={isDelivered ? 'mint' : 'royal'}
        meta={
          <>
            {lineCount} {i18n.t(lineCount > 1 ? 'products' : 'product')} ·{' '}
            {i18n.t('Total')}{' '}
            <strong className="text-ink-900 tabular-nums">{inTaxTotal}</strong>
          </>
        }
        backHref={`${workspaceURI}/${SUBAPP_CODES.orders}`}
        actions={
          orderReport ? (
            <Button asChild variant="ink-outline" size="sm">
              <a
                href={withBasePath(
                  `${workspaceURI}/${SUBAPP_CODES.orders}/api/order/${id}/attachment`,
                )}>
                <MdOutlineFileDownload className="text-base mr-1" />
                {i18n.t('Download order')}
              </a>
            </Button>
          ) : null
        }
      />

      <div className="max-w-[1100px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-7">
          {/* Left column */}
          <div className="flex flex-col gap-7">
            {/* Journey */}
            <Card>
              <CardHeader
                title={i18n.t('Tracking')}
                subtitle={i18n.t('Steps of your order')}
              />
              <StatusTimeline
                orientation="vertical"
                steps={journey.map(step => ({
                  ...step,
                  label: i18n.t(step.label as string),
                }))}
              />
            </Card>

            {/* Products */}
            <Card>
              <CardHeader
                title={i18n.t('Products')}
                trailing={
                  <span className="text-xs text-ink-400">
                    {lineCount} {i18n.t(lineCount > 1 ? 'items' : 'item')}
                  </span>
                }
              />
              <ul className="divide-y divide-ink-100">
                {saleOrderLineList.length === 0 && (
                  <li className="py-6 text-center text-sm text-ink-400">
                    {i18n.t('No records available')}
                  </li>
                )}
                {saleOrderLineList.map((line: any) => (
                  <ProductRow key={line.id} line={line} tenant={tenant} />
                ))}
              </ul>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-7">
            {/* Order summary */}
            <Card>
              <CardHeader title={i18n.t('Order summary')} />
              <dl className="space-y-2 text-sm">
                <SummaryRow label={i18n.t('Total WT')} value={exTaxTotal} />
                <SummaryRow label={i18n.t('Total ATI')} value={inTaxTotal} />
                {!hideDiscount && (
                  <SummaryRow
                    label={i18n.t('Discount')}
                    value={`${totalDiscount}%`}
                    accent
                  />
                )}
                {shipmentMode?.name && (
                  <SummaryRow
                    label={i18n.t('Shipping method')}
                    value={shipmentMode.name}
                    plain
                  />
                )}
              </dl>
              <div className="border-t border-ink-100 mt-4 pt-4 flex justify-between items-baseline">
                <span className="font-semibold text-ink-700">
                  {i18n.t('Total price')}
                </span>
                <span className="text-2xl font-bold text-ink-900 tabular-nums">
                  {inTaxTotal}
                </span>
              </div>
            </Card>

            {/* Addresses */}
            <Card>
              <CardHeader title={i18n.t('Addresses')} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <AddressBlock
                  label={i18n.t('Invoicing address')}
                  address={mainInvoicingAddress}
                />
                <AddressBlock
                  label={i18n.t('Delivery address')}
                  address={deliveryAddress}
                />
              </div>
            </Card>

            {/* Invoices / Deliveries — kept compact */}
            {invoices?.length ? (
              <DocList
                title={i18n.t(INVOICE)}
                items={invoices.map((record: any) => ({
                  id: record.id,
                  label: record.invoiceId,
                  date: record.createdOn ? formatDate(record.createdOn) : '',
                  downloadURL: withBasePath(
                    `${workspaceURI}/${SUBAPP_CODES.orders}/api/order/${id}/invoice/${record.id}`,
                  ),
                }))}
              />
            ) : null}

            {customerDeliveries?.length ? (
              <DocList
                title={i18n.t(CUSTOMER_DELIVERY)}
                items={customerDeliveries.map((record: any) => ({
                  id: record.id,
                  label: record.stockMoveSeq,
                  date: record.createdOn ? formatDate(record.createdOn) : '',
                  downloadURL: withBasePath(
                    `${workspaceURI}/${SUBAPP_CODES.orders}/api/order/${id}/customer-delivery/${record.id}`,
                  ),
                }))}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Content;

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
  statusKey: React.ComponentProps<typeof StatusPill>['status'];
  statusLabel: string;
  tone: 'mint' | 'royal';
  meta: React.ReactNode;
  backHref: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'border-b border-ink-100 px-8 pt-6 pb-10',
        tone === 'mint'
          ? 'bg-gradient-to-br from-mint-50 to-ink-25'
          : 'bg-gradient-to-br from-royal-pale to-ink-25',
      )}>
      <div className="max-w-[1100px] mx-auto">
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
                  tone === 'mint' ? 'text-mint-700' : 'text-royal',
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

function Card({children}: {children: React.ReactNode}) {
  return (
    <section className="bg-white rounded-xl border border-ink-100 shadow-xs p-6">
      {children}
    </section>
  );
}

function CardHeader({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold text-ink-900">{title}</h3>
        {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      {trailing}
    </header>
  );
}

function SummaryRow({
  label,
  value,
  accent,
  plain,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  plain?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className={cn(
          'whitespace-nowrap',
          accent ? 'text-mint-700 font-semibold' : 'text-ink-900',
          !plain && 'tabular-nums',
        )}>
        {value}
      </dd>
    </div>
  );
}

function AddressBlock({label, address}: {label: string; address: any}) {
  if (!address) {
    return (
      <div>
        <h4 className="text-xs uppercase tracking-[0.06em] font-semibold text-ink-400 mb-2">
          {label}
        </h4>
        <p className="text-sm text-ink-400">—</p>
      </div>
    );
  }
  const city = getCityName(address.addressl6);
  const name = [address.firstName, address.lastName].filter(Boolean).join(' ');
  return (
    <div>
      <h4 className="text-xs uppercase tracking-[0.06em] font-semibold text-ink-400 mb-2">
        {label}
      </h4>
      {(name || address.companyName) && (
        <p className="text-sm font-semibold text-ink-900">
          {name}
          {name && address.companyName ? ', ' : ''}
          {address.companyName}
        </p>
      )}
      <p className="text-sm text-ink-600 leading-snug mt-1">
        {address.addressl4}
        {city ? <>, {city}</> : null}
        {address.zip ? <>, {address.zip}</> : null}
        {address.country?.name ? <br /> : null}
        {address.country?.name}
      </p>
    </div>
  );
}

function ProductRow({line, tenant}: {line: any; tenant: any}) {
  const imageURL = getProductImageURL(line.product?.picture?.id, tenant, {
    noimage: true,
  });
  return (
    <li className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-ink-50 shrink-0">
        <Image
          src={imageURL}
          alt=""
          fill
          sizes="56px"
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-ink-900 truncate">
          {line.productName}
        </p>
        <p className="text-xs text-ink-500 mt-0.5 tabular-nums">
          {line.qty} {line.unit?.name || ''} · {line.priceDiscounted}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-ink-900 tabular-nums">
          {line.inTaxTotal}
        </p>
        {parseFloat(line.discountAmount) > 0 && (
          <p className="text-xs text-mint-700 tabular-nums">
            −{line.discountAmount}%
          </p>
        )}
      </div>
    </li>
  );
}

function DocList({
  title,
  items,
}: {
  title: string;
  items: {id: any; label: string; date: string; downloadURL: string}[];
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <ul className="divide-y divide-ink-100 -mx-1">
        {items.map(item => (
          <li
            key={item.id}
            className="flex items-center gap-3 py-2.5 px-1 text-sm">
            <span className="flex-1 truncate text-ink-900">{item.label}</span>
            <span className="text-ink-500 tabular-nums text-xs">
              {item.date}
            </span>
            <Button asChild variant="royal-ghost" size="sm" className="px-2">
              <a href={item.downloadURL} title={i18n.t(DOWNLOAD_PDF)}>
                <MdOutlineFileDownload className="text-base" />
              </a>
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
