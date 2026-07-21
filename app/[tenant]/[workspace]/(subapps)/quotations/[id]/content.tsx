'use client';

import {Suspense} from 'react';
import {Link} from '@/ui/components/link';
import Image from 'next/image';
import {MdArrowBack, MdEdit, MdSchedule} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Button, StatusPill, StatusTimeline} from '@/ui/components';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {cn} from '@/utils/css';
import {getCityName} from '@/utils';
import {getProductImageURL} from '@/utils/files';
import {formatDate} from '@/lib/core/locale/formatters';
import {SORT_TYPE, Comments, CommentsSkeleton} from '@/comments';

// ---- LOCAL IMPORTS ---- //
import {QUOTATION_STATUS} from '@/subapps/quotations/common/constants/quotations';
import type {
  QuotationDetail,
  Product,
} from '@/subapps/quotations/common/types/quotations';
import {
  fetchComments,
  createComment,
} from '@/subapps/quotations/common/actions';
import {withBasePath} from '@/lib/core/path/base-path';
import {
  getStatus,
  getStatusKey,
  getQuoteJourney,
  getQuoteTone,
} from '@/subapps/quotations/common/utils/quotations';

const Content = ({
  quotation,
  enableComment,
}: {
  quotation: QuotationDetail;
  enableComment: boolean;
  orderSubapp?: boolean;
}) => {
  const {
    id,
    saleOrderSeq,
    externalReference,
    displayExTaxTotal,
    displayInTaxTotal,
    endOfValidityDate,
    createdOn,
    mainInvoicingAddress,
    deliveryAddress,
    saleOrderLineList = [],
    totalDiscount,
    statusSelect,
  } = quotation;

  const {workspaceURI, tenant} = useWorkspace();

  const {status} = getStatus(statusSelect);
  const statusKey = getStatusKey(Number(statusSelect));
  const tone = getQuoteTone(Number(statusSelect));
  const isDraft = statusSelect === QUOTATION_STATUS.DRAFT_QUOTATION;
  const isCancelled = statusSelect === QUOTATION_STATUS.CANCELED_QUOTATION;

  const journey = getQuoteJourney(Number(statusSelect), {
    createdAt: createdOn ? formatDate(createdOn) : undefined,
  }).map(step => ({...step, label: i18n.t(step.label as string)}));

  const hideDiscount = saleOrderLineList?.every(
    item => parseFloat(String(item.discountAmount)) === 0,
  );
  const lineCount = saleOrderLineList?.length ?? 0;

  return (
    <div className="bg-ink-25 min-h-full">
      <Hero
        eyebrow={i18n.t('Quotation')}
        title={String(saleOrderSeq)}
        externalReference={externalReference ?? undefined}
        statusKey={statusKey}
        statusLabel={i18n.t(status)}
        tone={
          isCancelled
            ? 'rejected'
            : statusSelect === QUOTATION_STATUS.COMPLETED
              ? 'mint'
              : 'royal'
        }
        meta={
          <>
            {lineCount} {i18n.t(lineCount > 1 ? 'products' : 'product')} ·{' '}
            {i18n.t('Total')}{' '}
            <strong className="text-ink-900 tabular-nums">
              {displayInTaxTotal}
            </strong>
          </>
        }
        backHref={`${workspaceURI}/${SUBAPP_CODES.quotations}`}
        primaryAction={
          isDraft ? (
            <Button asChild variant="royal" size="sm">
              <Link
                href={`${workspaceURI}/${SUBAPP_PAGE.account}/${SUBAPP_PAGE.addresses}?quotation=${id}`}>
                <MdEdit className="text-base mr-1" />
                {i18n.t('Edit addresses')}
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="max-w-[1100px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-7">
          {/* Left column */}
          <div className="flex flex-col gap-7">
            {/* Lifecycle */}
            <Card>
              <CardHeader
                title={i18n.t('Lifecycle')}
                subtitle={i18n.t('Steps of your quotation')}
              />
              <StatusTimeline
                orientation="vertical"
                steps={journey}
                tone={tone}
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
                {saleOrderLineList.map(line => (
                  <ProductRow key={line.id} line={line} tenant={tenant} />
                ))}
              </ul>
            </Card>

            {/* Comments */}
            {enableComment && (
              <Card>
                <CardHeader title={i18n.t('Comments')} />
                <Suspense fallback={<CommentsSkeleton />}>
                  <Comments
                    variant="conversation"
                    inputPosition="bottom"
                    recordId={id}
                    subapp={SUBAPP_CODES.quotations}
                    sortBy={SORT_TYPE.new}
                    showCommentsByDefault
                    hideTopBorder
                    hideCloseComments
                    hideCommentsHeader
                    hideSortBy
                    showRepliesInMainThread
                    createComment={createComment}
                    fetchComments={fetchComments}
                    attachmentDownloadUrl={withBasePath(
                      `${workspaceURI}/${SUBAPP_CODES.quotations}/api/comments/attachments/${id}`,
                    )}
                    trackingField="body"
                    commentField="body"
                    disableReply
                  />
                </Suspense>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-7">
            {/* Summary */}
            <Card>
              <CardHeader title={i18n.t('Summary')} />
              <dl className="space-y-2 text-sm">
                <SummaryRow
                  label={i18n.t('Total WT')}
                  value={displayExTaxTotal}
                />
                <SummaryRow
                  label={i18n.t('Total ATI')}
                  value={displayInTaxTotal}
                />
                {!hideDiscount && (
                  <SummaryRow
                    label={i18n.t('Discount')}
                    value={`${totalDiscount}%`}
                    accent
                  />
                )}
              </dl>
              <div className="border-t border-ink-100 mt-4 pt-4 flex justify-between items-baseline">
                <span className="font-semibold text-ink-700">
                  {i18n.t('Total price')}
                </span>
                <span className="text-2xl font-bold text-ink-900 tabular-nums">
                  {displayInTaxTotal}
                </span>
              </div>
            </Card>

            {/* Validity card */}
            {endOfValidityDate && !isCancelled && (
              <div className="rounded-xl p-5 bg-royal-pale border border-royal-border">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-white grid place-items-center text-royal shrink-0 shadow-xs">
                    <MdSchedule className="text-xl" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-royal">
                      {i18n.t('Offer validity')}
                    </p>
                    <p className="text-sm font-semibold text-ink-900 tabular-nums mt-0.5">
                      {i18n.t('Until')} {formatDate(endOfValidityDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
  externalReference,
  statusKey,
  statusLabel,
  tone,
  meta,
  backHref,
  primaryAction,
}: {
  eyebrow: string;
  title: string;
  externalReference?: string;
  statusKey: React.ComponentProps<typeof StatusPill>['status'];
  statusLabel: string;
  tone: 'mint' | 'royal' | 'rejected';
  meta: React.ReactNode;
  backHref: string;
  primaryAction?: React.ReactNode;
}) {
  const gradient =
    tone === 'mint'
      ? 'bg-gradient-to-br from-mint-50 to-ink-25'
      : tone === 'rejected'
        ? 'bg-gradient-to-br from-status-rejected-bg to-ink-25'
        : 'bg-gradient-to-br from-royal-pale to-ink-25';
  const eyebrowColor =
    tone === 'mint'
      ? 'text-mint-700'
      : tone === 'rejected'
        ? 'text-status-rejected-fg'
        : 'text-royal';

  return (
    <div className={cn('border-b border-ink-100 px-8 pt-6 pb-10', gradient)}>
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
                  eyebrowColor,
                )}>
                {eyebrow}
              </span>
              <StatusPill status={statusKey}>{statusLabel}</StatusPill>
            </div>
            <h1 className="text-[44px] font-bold leading-none tracking-[-0.03em] text-ink-900 tabular-nums">
              {title}
            </h1>
            {externalReference && (
              <p className="text-sm text-ink-500 mt-2">
                {i18n.t('Reference')}: {externalReference}
              </p>
            )}
            <div className="mt-3 text-sm text-ink-600">{meta}</div>
          </div>
          {primaryAction && (
            <div className="flex gap-2 flex-wrap">{primaryAction}</div>
          )}
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
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className={cn(
          'tabular-nums whitespace-nowrap',
          accent ? 'text-mint-700 font-semibold' : 'text-ink-900',
        )}>
        {value}
      </dd>
    </div>
  );
}

function AddressBlock({
  label,
  address,
}: {
  label: string;
  address: QuotationDetail['deliveryAddress'] | null | undefined;
}) {
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

function ProductRow({line, tenant}: {line: Product; tenant: string}) {
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
        {parseFloat(String(line.discountAmount)) > 0 && (
          <p className="text-xs text-mint-700 tabular-nums">
            −{line.discountAmount}%
          </p>
        )}
      </div>
    </li>
  );
}
