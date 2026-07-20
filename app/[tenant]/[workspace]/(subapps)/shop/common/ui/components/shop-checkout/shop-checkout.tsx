'use client';

import {useEffect, useMemo, useState} from 'react';
import Image from 'next/image';
import {Link} from '@/ui/components/link';
import {MdAdd, MdArrowBack, MdCheck, MdPlace} from 'react-icons/md';

import {SUBAPP_CODES, ADDRESS_TYPE} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {i18n} from '@/locale';
import {getProductImageURL} from '@/utils/files';
import {cn} from '@/utils/css';
import type {Cloned} from '@/types/util';

import {
  fetchDeliveryAddresses,
  fetchInvoicingAddresses,
  findDefaultDelivery,
  findDefaultInvoicing,
} from '@/subapps/shop/common/actions/address';
import type {ShopConfig} from '@/subapps/shop/common/orm/config';
import {ShopPayments} from '../shop-payments';
import {SHIPPING_TYPE} from '@/subapps/shop/common/constants';
import {
  getCategoryGradient,
  getCategoryHue,
} from '@/subapps/shop/common/utils/category-style';
import {findProduct} from '@/subapps/shop/common/actions/cart';

const SHIPPING_PRICES: Record<string, number> = {
  [SHIPPING_TYPE.REGULAR]: 2,
  [SHIPPING_TYPE.FAST]: 5,
};

const VAT_RATE = 0.2;

export interface ShopCheckoutLabels {
  backToCart: string;
  step1: string;
  step2: string;
  step3: string;
  pageTitle: string;
  addressCardTitle: string;
  addressDefaultBadge: string;
  addressNewAction: string;
  addressNoneTitle: string;
  addressLoading: string;
  shippingCardTitle: string;
  shippingRegular: string;
  shippingRegularSubtitle: string;
  shippingFast: string;
  shippingFastSubtitle: string;
  paymentCardTitle: string;
  summaryTitle: string;
  qtyPrefix: string;
  subtotalHtLabel: string;
  vatLabel: string;
  shippingLabel: string;
  totalLabel: string;
  secureNotice: string;
  emptyCartTitle: string;
  loading: string;
}

export function ShopCheckout({
  config,
  orderSubapp,
  labels,
}: {
  config: ShopConfig | Cloned<ShopConfig>;
  orderSubapp?: any;
  labels: ShopCheckoutLabels;
}) {
  const {workspaceURI, workspaceURL, tenant} = useWorkspace();
  const {cart} = useCart();
  const [computedProducts, setComputedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingType, setShippingType] = useState<string>(
    SHIPPING_TYPE.REGULAR,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cart) return;
      const items = cart.items ?? [];
      if (!items.length) {
        if (!cancelled) {
          setComputedProducts([]);
          setLoading(false);
        }
        return;
      }
      try {
        const results = await Promise.all(
          items.map((i: any) =>
            findProduct({id: String(i.product), workspaceURL}),
          ),
        );
        if (!cancelled) setComputedProducts(results.filter(Boolean));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cart, workspaceURL]);

  const items = useMemo<any[]>(() => {
    return (cart?.items ?? [])
      .map((i: any) => ({
        ...i,
        computedProduct: computedProducts.find(
          cp => Number(cp?.product?.id) === Number(i.product),
        ),
      }))
      .filter((i: any) => i.computedProduct);
  }, [cart?.items, computedProducts]);

  const subtotal = useMemo(() => {
    let sum = 0;
    for (const item of items) {
      // Numeric price rather than re-parsing the localized display string.
      const n = Number(item.computedProduct?.price?.primary ?? 0);
      if (Number.isFinite(n)) sum += n * Number(item.quantity ?? 0);
    }
    return sum;
  }, [items]);
  const vat = subtotal * VAT_RATE;
  const shippingPrice = SHIPPING_PRICES[shippingType] ?? 0;
  const total = subtotal + vat + shippingPrice;
  const currency =
    items[0]?.computedProduct?.product?.saleCurrency?.symbol ?? '€';

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(n)
      .concat(' ', currency);

  const cartHref = `${workspaceURI}/${SUBAPP_CODES.shop}/cart`;
  const confirmOrder = !!config?.confirmOrder;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ink-25">
      <div className="px-6 md:px-8 py-6 pb-14 max-w-[1100px] mx-auto">
        <Link
          href={cartHref}
          className="inline-flex items-center gap-1.5 mb-4 text-[13px] text-ink-500 hover:text-ink-700 transition-colors">
          <MdArrowBack className="text-sm" />
          {labels.backToCart}
        </Link>

        {/* Stepper */}
        <div className="flex items-center gap-1.5 mb-[26px] flex-wrap">
          <StepPill state="done" label={labels.step1} />
          <ChevronSep />
          <StepPill state="active" label={labels.step2} />
          <ChevronSep />
          <StepPill state="idle" label={labels.step3} />
        </div>

        <h1 className="m-0 mb-[22px] text-[28px] font-extrabold text-ink-900 tracking-[-0.025em]">
          {labels.pageTitle}
        </h1>

        {loading ? (
          <div className="bg-white border border-ink-100 rounded-2xl px-6 py-14 text-center shadow-xs">
            <p className="text-[13px] text-ink-500">{labels.loading}…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-ink-100 rounded-2xl px-6 py-14 text-center shadow-xs">
            <p className="text-base font-bold text-ink-900">
              {labels.emptyCartTitle}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* Left: cards */}
            <div className="flex flex-col gap-[18px]">
              <SectionCard title={labels.addressCardTitle}>
                <CheckoutAddressPicker
                  type={ADDRESS_TYPE.delivery}
                  workspaceURI={workspaceURI}
                  defaultBadgeLabel={labels.addressDefaultBadge}
                  newActionLabel={labels.addressNewAction}
                  noneTitle={labels.addressNoneTitle}
                  loadingLabel={labels.addressLoading}
                />
              </SectionCard>

              <SectionCard title={i18n.t('Billing address')}>
                <CheckoutAddressPicker
                  type={ADDRESS_TYPE.invoicing}
                  workspaceURI={workspaceURI}
                  defaultBadgeLabel={labels.addressDefaultBadge}
                  newActionLabel={labels.addressNewAction}
                  noneTitle={labels.addressNoneTitle}
                  loadingLabel={labels.addressLoading}
                />
              </SectionCard>

              <SectionCard title={labels.shippingCardTitle}>
                <div className="flex flex-col gap-2.5">
                  <ShippingOption
                    id={SHIPPING_TYPE.REGULAR}
                    label={labels.shippingRegular}
                    subtitle={labels.shippingRegularSubtitle}
                    price={fmt(SHIPPING_PRICES[SHIPPING_TYPE.REGULAR])}
                    checked={shippingType === SHIPPING_TYPE.REGULAR}
                    onChange={() => setShippingType(SHIPPING_TYPE.REGULAR)}
                  />
                  <ShippingOption
                    id={SHIPPING_TYPE.FAST}
                    label={labels.shippingFast}
                    subtitle={labels.shippingFastSubtitle}
                    price={fmt(SHIPPING_PRICES[SHIPPING_TYPE.FAST])}
                    checked={shippingType === SHIPPING_TYPE.FAST}
                    onChange={() => setShippingType(SHIPPING_TYPE.FAST)}
                  />
                </div>
              </SectionCard>

              <SectionCard title={labels.paymentCardTitle}>
                {confirmOrder ? (
                  <ShopPayments config={config} orderSubapp={orderSubapp} />
                ) : (
                  <p className="text-[13px] text-ink-500">—</p>
                )}
              </SectionCard>
            </div>

            {/* Right sticky summary */}
            <aside className="lg:sticky lg:top-5">
              <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-[22px] pt-[18px] pb-3.5 border-b border-ink-100">
                  <h3 className="m-0 text-base font-bold text-ink-900">
                    {labels.summaryTitle}
                  </h3>
                </div>
                <ul className="flex flex-col gap-3 px-[22px] py-3.5 border-b border-ink-100">
                  {items.map((item: any) => (
                    <SummaryRow
                      key={item.computedProduct.product.id}
                      item={item}
                      tenant={tenant}
                      qtyPrefix={labels.qtyPrefix}
                      fmt={fmt}
                    />
                  ))}
                </ul>
                <div className="p-[22px]">
                  <TotalsRow
                    label={labels.subtotalHtLabel}
                    value={fmt(subtotal)}
                  />
                  <TotalsRow label={labels.vatLabel} value={fmt(vat)} />
                  <TotalsRow
                    label={labels.shippingLabel}
                    value={fmt(shippingPrice)}
                  />
                  <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-ink-100">
                    <span className="text-sm font-bold text-ink-900">
                      {labels.totalLabel}
                    </span>
                    <span className="text-[22px] font-extrabold text-ink-900 tabular-nums tracking-[-0.02em]">
                      {fmt(total)}
                    </span>
                  </div>
                  {/* Note: actual "Pay" button is rendered by <ShopPayments>
                        in the left payment card. Keep the secure notice here. */}
                  <p className="m-0 mt-3.5 text-[11.5px] text-ink-500 text-center leading-[1.5]">
                    {labels.secureNotice}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function StepPill({
  state,
  label,
}: {
  state: 'done' | 'active' | 'idle';
  label: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-bold',
        state === 'active' && 'bg-royal text-white',
        state === 'done' && 'bg-mint-50 text-mint-700',
        state === 'idle' && 'bg-ink-50 text-ink-600',
      )}>
      {state === 'done' && <MdCheck className="text-sm" />}
      {label}
    </span>
  );
}

function ChevronSep() {
  return <span className="text-ink-300">→</span>;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-ink-100 rounded-2xl p-[22px] shadow-xs">
      <h3 className="m-0 mb-4 text-base font-bold text-ink-900 tracking-[-0.015em]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ShippingOption({
  id,
  label,
  subtitle,
  price,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  subtitle: string;
  price: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      htmlFor={`v3-ship-${id}`}
      className={cn(
        'flex items-center gap-3.5 px-4 py-3.5 rounded-xl cursor-pointer transition-colors',
        checked
          ? 'border-[1.5px] border-royal bg-royal-pale/60'
          : 'border border-ink-150 hover:border-ink-300',
      )}>
      <input
        id={`v3-ship-${id}`}
        type="radio"
        name="v3-shipping"
        value={id}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-royal cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <p className="m-0 text-sm font-semibold text-ink-900">{label}</p>
        <p className="m-0 mt-0.5 text-xs text-ink-500">{subtitle}</p>
      </div>
      <span className="text-sm font-bold text-ink-900 tabular-nums">
        {price}
      </span>
    </label>
  );
}

function SummaryRow({
  item,
  tenant,
  qtyPrefix,
  fmt,
}: {
  item: any;
  tenant: string;
  qtyPrefix: string;
  fmt: (n: number) => string;
}) {
  const product = item.computedProduct.product;
  const portalCat = product?.portalCategorySet?.[0];
  const productCat = product?.productCategory;
  const cat = portalCat ?? productCat ?? null;
  const catName = cat?.name ?? null;
  const hue = getCategoryHue(catName);

  const imageId = product?.thumbnailImage?.id || product?.images?.[0];
  const imageURL = imageId ? getProductImageURL(imageId, tenant) : null;

  const unitNum = Number(item.computedProduct?.price?.primary ?? 0);
  const qty = Number(item.quantity ?? 0);
  const lineTotal = Number.isFinite(unitNum) ? unitNum * qty : 0;

  return (
    <li className="flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-lg grid place-items-center shrink-0 overflow-hidden relative"
        style={imageURL ? undefined : {background: getCategoryGradient(hue)}}>
        {imageURL ? (
          <Image
            src={imageURL}
            alt={i18n.tattr(product.name)}
            fill
            className="object-cover"
            sizes="44px"
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-ink-900 truncate">
          {i18n.tattr(product.name)}
        </div>
        <div className="text-[11px] text-ink-500">
          {qtyPrefix} {qty}
        </div>
      </div>
      <span className="text-[13px] font-bold text-ink-900 tabular-nums">
        {fmt(lineTotal)}
      </span>
    </li>
  );
}

function TotalsRow({label, value}: {label: string; value: string}) {
  return (
    <div className="flex justify-between items-baseline py-1 text-[13.5px]">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold tabular-nums text-ink-900">{value}</span>
    </div>
  );
}

function CheckoutAddressPicker({
  type,
  workspaceURI,
  defaultBadgeLabel,
  newActionLabel,
  noneTitle,
  loadingLabel,
}: {
  type: ADDRESS_TYPE;
  workspaceURI: string;
  defaultBadgeLabel: string;
  newActionLabel: string;
  noneTitle: string;
  loadingLabel: string;
}) {
  const {cart, updateAddress} = useCart();
  const {workspaceURL} = useWorkspace();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isInvoicing = type === ADDRESS_TYPE.invoicing;

  // Load the addresses for this address type and seed the matching cart field.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, def] = await Promise.all([
          isInvoicing
            ? fetchInvoicingAddresses({workspaceURL})
            : fetchDeliveryAddresses({workspaceURL}),
          isInvoicing
            ? findDefaultInvoicing({workspaceURL})
            : findDefaultDelivery({workspaceURL}),
        ]);
        if (cancelled) return;
        const all = (list as any[]) ?? [];
        setAddresses(all);

        const cartId =
          (isInvoicing ? cart?.invoicingAddress : cart?.deliveryAddress) ??
          null;
        const initial =
          (cartId && all.find(a => String(a.id) === String(cartId))) ||
          (def as any) ||
          all[0] ||
          null;

        if (initial?.id) {
          setSelectedId(String(initial.id));
          if (cartId !== initial.id) {
            updateAddress({addressType: type, address: initial.id});
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (addr: any) => {
    setSelectedId(String(addr.id));
    updateAddress({addressType: type, address: addr.id});
  };

  const newAddressHref = `${workspaceURI}/account/addresses?checkout=true&callbackURL=${encodeURIComponent(
    `${workspaceURI}/${SUBAPP_CODES.shop}/cart/checkout`,
  )}`;

  if (loading) {
    return (
      <div className="rounded-xl border border-ink-150 px-4 py-3.5 text-[13px] text-ink-500">
        {loadingLabel}…
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-ink-150 px-4 py-3.5 text-[13px] text-ink-700">
          <MdPlace className="text-base text-royal shrink-0" />
          {noneTitle}
        </div>
        <Link
          href={newAddressHref}
          className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-royal-dark border border-royal-border text-[12.5px] font-semibold hover:bg-royal-pale transition-colors">
          <MdAdd className="text-base" />
          {newActionLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {addresses.map(a => {
        const active = String(a.id) === selectedId;
        const isDefault = !!(a.isDefaultDelivery || a.isDefaultInvoicing);
        return (
          <label
            key={a.id}
            className={cn(
              'flex items-start gap-3.5 px-4 py-3.5 rounded-xl cursor-pointer transition-colors',
              active
                ? 'border-[1.5px] border-royal bg-royal-pale/60'
                : 'border border-ink-150 hover:border-ink-300',
            )}>
            <input
              type="radio"
              name={`checkout-address-${type}`}
              checked={active}
              onChange={() => handleSelect(a)}
              className="w-4 h-4 mt-1 accent-royal cursor-pointer shrink-0"
            />
            <span className="grid place-items-center w-8 h-8 mt-0.5 rounded-lg bg-white border border-ink-100 text-royal shrink-0">
              <MdPlace className="text-base" />
            </span>
            <div className="flex-1 min-w-0">
              <AddressLines address={a.address} />
            </div>
            {isDefault && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white text-royal-dark border border-royal-border text-[10.5px] font-bold uppercase tracking-[0.04em] shrink-0 mt-1">
                {defaultBadgeLabel}
              </span>
            )}
          </label>
        );
      })}
      <Link
        href={newAddressHref}
        className="self-start mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-royal-dark border border-royal-border text-[12.5px] font-semibold hover:bg-royal-pale transition-colors">
        <MdAdd className="text-base" />
        {newActionLabel}
      </Link>
    </div>
  );
}

function AddressLines({address}: {address: any}) {
  if (!address) return null;
  return (
    <div className="text-[12.5px] leading-tight">
      {address.addressl2 && (
        <p className="m-0 text-[13px] font-bold text-ink-900 truncate">
          {address.addressl2}
        </p>
      )}
      {address.addressl4 && (
        <p className="m-0 text-ink-700 truncate">{address.addressl4}</p>
      )}
      {address.addressl6 && (
        <p className="m-0 text-ink-700 truncate">{address.addressl6}</p>
      )}
      {address.country?.name && (
        <p className="m-0 text-ink-500 truncate">{address.country.name}</p>
      )}
    </div>
  );
}
