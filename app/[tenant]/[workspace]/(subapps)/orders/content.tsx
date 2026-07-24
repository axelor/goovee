'use client';

import {useMemo, useState} from 'react';
import {Link} from '@/ui/components/link';
import {useRouter, useSearchParams} from 'next/navigation';
import {
  MdChevronLeft,
  MdChevronRight,
  MdSearch,
  MdOutlineInbox,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Button, StatusPill, StatusTimeline} from '@/ui/components';
import {i18n} from '@/locale';
import {SUBAPP_CODES, URL_PARAMS} from '@/constants';
import {cn} from '@/utils/css';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useSearchQuery} from '@/ui/hooks';
import {formatDate} from '@/lib/core/locale/formatters';
import type {PageInfo} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {ORDER_TAB_ITEMS} from '@/subapps/orders/common/constants/orders';
import {
  getStatus,
  getStatusKey,
  getOrderJourney,
} from '@/subapps/orders/common/utils/orders';
import type {Order} from '@/subapps/orders/common/types/orders';

type ContentProps = {
  orders: Order[];
  pageInfo?: PageInfo;
  orderType: string;
};

const Content = ({orders, pageInfo, orderType}: ContentProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {workspaceURI} = useWorkspace();

  const [input, setInput] = useSearchQuery();

  const [selectedId, setSelectedId] = useState<string | null>(
    () => orders[0]?.id ?? null,
  );

  const selected = useMemo(
    () => orders.find(o => o.id === selectedId) ?? orders[0],
    [orders, selectedId],
  );

  const setPage = (next: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set(URL_PARAMS.page, String(next));
    router.push(`?${sp.toString()}`);
  };

  const handleTabChange = (href: string) => {
    router.push(`${workspaceURI}/${SUBAPP_CODES.orders}?type=${href}`);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Persistent ongoing / completed tabs */}
      <div className="border-b border-ink-100 bg-white shrink-0">
        <nav className="max-w-[1280px] mx-auto px-8 flex gap-8">
          {ORDER_TAB_ITEMS.map(tab => {
            const isActive = tab.href === orderType;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.href)}
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

      <div className="bg-ink-25 flex-1 min-h-0 flex flex-col">
        <div className="w-full max-w-[1280px] mx-auto px-8 py-6 flex-1 min-h-0 flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 flex-1 min-h-0">
            {/* Left — list */}
            <aside className="bg-white rounded-xl border border-ink-100 shadow-xs flex flex-col overflow-hidden min-h-[480px] lg:min-h-0 lg:h-full">
              <header className="px-5 pt-5 pb-3">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-lg font-bold text-ink-900">
                    {i18n.t('Orders')}
                  </h2>
                  <span className="text-xs text-ink-400 tabular-nums">
                    {Number(pageInfo?.count ?? orders.length)} {i18n.t('items')}
                  </span>
                </div>
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-royal text-base" />
                  <input
                    type="search"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={i18n.t('Search an order')}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-royal-pale/60 border border-royal-border text-sm placeholder:text-ink-400 outline-none focus:border-royal focus:bg-royal-pale focus:shadow-[0_0_0_3px_rgba(21,84,181,0.12)] transition"
                  />
                </div>
              </header>
              <ul className="flex-1 overflow-y-auto px-2 pb-2">
                {orders.length === 0 ? (
                  <li className="py-10 text-center text-sm text-ink-400 flex flex-col items-center gap-2">
                    <MdOutlineInbox className="text-3xl text-ink-300" />
                    {i18n.t('No orders found')}
                  </li>
                ) : (
                  orders.map(o => (
                    <OrderItem
                      key={o.id}
                      order={o}
                      selected={o.id === selected?.id}
                      onSelect={() => setSelectedId(o.id)}
                      onOpen={() =>
                        router.push(
                          `${workspaceURI}/${SUBAPP_CODES.orders}/${o.id}`,
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
            </aside>

            {/* Right — preview */}
            {selected ? (
              <OrderPreview
                order={selected}
                detailHref={`${workspaceURI}/${SUBAPP_CODES.orders}/${selected.id}`}
              />
            ) : (
              <div className="bg-white rounded-xl border border-ink-100 shadow-xs grid place-items-center min-h-[400px]">
                <div className="text-center">
                  <MdOutlineInbox className="text-5xl text-ink-300 mx-auto mb-2" />
                  <p className="text-sm text-ink-400">
                    {i18n.t('Select an order to see its details')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Content;

// ---- Local building blocks ---- //

function OrderItem({
  order,
  selected,
  onSelect,
  onOpen,
}: {
  order: Order;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const statusKey = getStatusKey(order.statusSelect, order.deliveryState);
  const {status} = getStatus(order.statusSelect, order.deliveryState);
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
            {order.saleOrderSeq}
          </span>
          <StatusPill status={statusKey} size="sm">
            {i18n.t(status)}
          </StatusPill>
        </div>
        <div className="flex items-center justify-between text-xs text-ink-500 tabular-nums">
          <span>{order.createdOn ? formatDate(order.createdOn) : ''}</span>
          <span className="font-semibold text-ink-900">{order.inTaxTotal}</span>
        </div>
      </button>
    </li>
  );
}

function OrderPreview({order, detailHref}: {order: Order; detailHref: string}) {
  const statusKey = getStatusKey(order.statusSelect, order.deliveryState);
  const {status} = getStatus(order.statusSelect, order.deliveryState);
  const journey = getOrderJourney(order.statusSelect, order.deliveryState).map(
    step => ({...step, label: i18n.t(step.label as string)}),
  );
  // Horizontal timeline shows 3 stages (skip "confirmed" to compact).
  const compactJourney = [journey[0], journey[2], journey[3]];

  return (
    <section className="bg-white rounded-xl border border-ink-100 shadow-xs p-7 self-start">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">
              {i18n.t('Order')}
            </span>
            <StatusPill status={statusKey} size="sm">
              {i18n.t(status)}
            </StatusPill>
          </div>
          <h2 className="text-2xl font-bold text-ink-900 tabular-nums">
            {order.saleOrderSeq}
          </h2>
        </div>
        <Button asChild variant="royal" size="sm">
          <Link href={detailHref}>{i18n.t('View details')}</Link>
        </Button>
      </div>

      <div className="bg-ink-25 rounded-lg p-5 mb-6">
        <StatusTimeline steps={compactJourney} />
      </div>

      <dl className="grid grid-cols-3 gap-6 text-sm">
        <PreviewField label={i18n.t('Status')} value={i18n.t(status)} />
        <PreviewField
          label={i18n.t('Created on')}
          value={order.createdOn ? formatDate(order.createdOn) : ''}
        />
        <PreviewField
          label={i18n.t('Total ATI')}
          value={order.inTaxTotal}
          emphasis
        />
      </dl>
    </section>
  );
}

function PreviewField({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
        {label}
      </dt>
      <dd
        className={cn(
          'tabular-nums',
          emphasis ? 'text-lg font-bold text-ink-900' : 'text-sm text-ink-700',
        )}>
        {value}
      </dd>
    </div>
  );
}
