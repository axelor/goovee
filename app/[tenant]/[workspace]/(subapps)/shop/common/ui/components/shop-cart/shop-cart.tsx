'use client';

import {useEffect, useMemo, useState} from 'react';
import Image from 'next/image';
import {Link} from '@/ui/components/link';
import {authClient} from '@/lib/auth-client';
import {usePathname} from 'next/navigation';
import {
  MdArrowForward,
  MdChevronRight,
  MdClose,
  MdDescription,
} from 'react-icons/md';

import {SUBAPP_CODES, SEARCH_PARAMS} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {i18n} from '@/locale';
import {getProductImageURL} from '@/utils/files';
import {cn} from '@/utils/css';
import type {Product} from '@/types';

import {
  getCategoryGradient,
  getCategoryHue,
} from '@/subapps/shop/common/utils/category-style';
import {findProduct} from '@/subapps/shop/common/actions/cart';
import {ShopQuoteModal, type ShopQuoteModalLabels} from '../shop-quote-modal';

export interface ShopCartLabels {
  breadcrumbRoot: string;
  breadcrumbCurrent: string;
  pageTitle: string;
  itemsLabelOne: string;
  itemsLabel: string;
  unitSuffix: string;
  emptyTitle: string;
  emptyCta: string;
  summaryTitle: string;
  subtotalHtLabel: string;
  vatLabel: string;
  shippingLabel: string;
  shippingTbdValue: string;
  totalLabel: string;
  proceedToCheckout: string;
  continueShopping: string;
  quoteBannerTitle: string;
  quoteBannerCta: string;
  removeLabel: string;
  loginToCheckout: string;
  loading: string;
}

const VAT_RATE = 0.2;

export function ShopCart({
  labels,
  modalLabels,
  hideRequestQuotation,
  hideCheckout,
  quotationSubapp,
}: {
  labels: ShopCartLabels;
  modalLabels: ShopQuoteModalLabels;
  hideRequestQuotation: boolean;
  hideCheckout: boolean;
  quotationSubapp: boolean;
}) {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const {workspaceURI, workspaceURL, tenant} = useWorkspace();
  const pathname = usePathname() ?? '';
  const {cart, removeItem, updateQuantity} = useCart();
  const {data: session} = authClient.useSession();
  const authenticated = !!session?.user?.id;

  const [computedProducts, setComputedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolve each cart item against the API to get the computed product.
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
      // Use the numeric price rather than re-parsing the localized display
      // string (which broke for locales where "," is a thousands separator).
      const n = Number(item.computedProduct?.price?.primary ?? 0);
      if (Number.isFinite(n)) sum += n * Number(item.quantity ?? 0);
    }
    return sum;
  }, [items]);
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;
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

  const handleQty = async (productId: any, q: number, computedProduct: any) => {
    if (q < 1) return;
    await updateQuantity({
      productId,
      quantity: q,
      computedProduct,
      images: (computedProduct?.product?.images ?? []).map(String),
    });
  };

  const handleRemove = async (product: Product) => {
    await removeItem(product.id);
  };

  const catalogHref = `${workspaceURI}/${SUBAPP_CODES.shop}`;
  const checkoutHref = `${workspaceURI}/${SUBAPP_CODES.shop}/cart/checkout`;
  const loginHref = `/auth/login?callbackurl=${encodeURIComponent(
    pathname,
  )}&workspaceURI=${encodeURIComponent(workspaceURI)}&${SEARCH_PARAMS.TENANT_ID}=${encodeURIComponent(
    tenant,
  )}`;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ink-25">
      <div className="px-6 md:px-8 py-6 pb-14 max-w-[1100px] mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-ink-500 mb-3.5">
          <Link
            href={catalogHref}
            className="hover:text-ink-700 transition-colors">
            {labels.breadcrumbRoot}
          </Link>
          <MdChevronRight className="text-ink-300 text-xs" />
          <span className="text-ink-900 font-semibold">
            {labels.breadcrumbCurrent}
          </span>
        </nav>

        <h1 className="m-0 mb-[22px] text-[28px] font-extrabold text-ink-900 tracking-[-0.025em]">
          {labels.pageTitle}{' '}
          <span className="text-ink-400 font-medium text-[20px]">
            · {items.length}{' '}
            {items.length === 1 ? labels.itemsLabelOne : labels.itemsLabel}
          </span>
        </h1>

        {loading ? (
          <div className="bg-white border border-ink-100 rounded-2xl px-6 py-14 text-center shadow-xs">
            <p className="text-[13px] text-ink-500">{labels.loading}…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-ink-100 rounded-2xl px-6 py-14 text-center shadow-xs">
            <div className="text-[40px] mb-2.5">🛒</div>
            <p className="text-base font-bold text-ink-900">
              {labels.emptyTitle}
            </p>
            <Link
              href={catalogHref}
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2.5 rounded-xl bg-royal hover:bg-royal-dark text-white text-sm font-bold transition-colors">
              {labels.emptyCta}
              <MdArrowForward className="text-base" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            {/* Items list */}
            <div className="flex flex-col gap-3">
              {items.map((item: any) => (
                <CartLine
                  key={item.computedProduct.product.id}
                  item={item}
                  tenant={tenant}
                  workspaceURI={workspaceURI}
                  onQtyChange={q =>
                    handleQty(
                      item.computedProduct.product.id,
                      q,
                      item.computedProduct,
                    )
                  }
                  onRemove={() => handleRemove(item.computedProduct.product)}
                  fmt={fmt}
                  unitSuffix={labels.unitSuffix}
                  removeLabel={labels.removeLabel}
                />
              ))}
            </div>

            {/* Sticky summary */}
            <aside className="lg:sticky lg:top-5 flex flex-col gap-3">
              <div className="bg-white border border-ink-100 rounded-2xl p-[22px] shadow-xs">
                <h3 className="m-0 mb-4 text-base font-bold text-ink-900">
                  {labels.summaryTitle}
                </h3>
                <SummaryRow
                  label={labels.subtotalHtLabel}
                  value={fmt(subtotal)}
                />
                <SummaryRow label={labels.vatLabel} value={fmt(vat)} />
                <SummaryRow
                  label={labels.shippingLabel}
                  value={labels.shippingTbdValue}
                  muted
                />
                <div className="flex justify-between items-baseline pt-3.5 mt-2 border-t border-ink-100">
                  <span className="text-sm font-bold text-ink-900">
                    {labels.totalLabel}
                  </span>
                  <span className="text-[22px] font-extrabold text-ink-900 tabular-nums tracking-[-0.02em]">
                    {fmt(total)}
                  </span>
                </div>

                {authenticated && !hideCheckout && (
                  <Link
                    href={checkoutHref}
                    className={cn(
                      'w-full mt-[18px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
                      'bg-royal text-white text-sm font-bold hover:bg-royal-dark transition-colors',
                    )}
                    style={{
                      boxShadow:
                        '0 1px 2px rgba(13,30,75,0.15), 0 4px 12px rgba(13,30,75,0.12)',
                    }}>
                    {labels.proceedToCheckout}
                    <MdArrowForward className="text-base" />
                  </Link>
                )}
                {!authenticated && (
                  <Link
                    href={loginHref}
                    className="w-full mt-[18px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-royal text-white text-sm font-bold hover:bg-royal-dark transition-colors">
                    {labels.loginToCheckout}
                  </Link>
                )}
                <Link
                  href={catalogHref}
                  className="w-full mt-2.5 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-ink-700 border border-ink-150 text-[13px] font-semibold hover:bg-ink-25 transition-colors">
                  {labels.continueShopping}
                </Link>
              </div>

              {!hideRequestQuotation && (
                <div className="bg-ink-25 border border-ink-100 rounded-xl p-3.5 flex items-center gap-2.5 text-[12.5px] text-ink-600">
                  <MdDescription className="text-base text-royal shrink-0" />
                  <span className="flex-1">{labels.quoteBannerTitle}</span>
                  <button
                    type="button"
                    onClick={() => setQuoteModalOpen(true)}
                    className="text-royal font-bold hover:text-royal-dark whitespace-nowrap">
                    {labels.quoteBannerCta}
                  </button>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      {!hideRequestQuotation && (
        <ShopQuoteModal
          open={quoteModalOpen}
          onOpenChange={setQuoteModalOpen}
          computedItems={items}
          quotationSubapp={quotationSubapp}
          labels={modalLabels}
        />
      )}
    </div>
  );
}

function CartLine({
  item,
  tenant,
  workspaceURI,
  onQtyChange,
  onRemove,
  fmt,
  unitSuffix,
  removeLabel,
}: {
  item: any;
  tenant: string;
  workspaceURI: string;
  onQtyChange: (q: number) => Promise<void>;
  onRemove: () => Promise<void>;
  fmt: (n: number) => string;
  unitSuffix: string;
  removeLabel: string;
}) {
  const product = item.computedProduct.product;
  const price = item.computedProduct.price;
  const portalCat = product?.portalCategorySet?.[0];
  const productCat = product?.productCategory;
  const cat = portalCat ?? productCat ?? null;
  const catName = cat?.name ?? null;
  const hue = getCategoryHue(catName);

  const imageId = product?.thumbnailImage?.id || product?.images?.[0];
  const imageURL = imageId ? getProductImageURL(imageId, tenant) : null;

  const productHref = `${workspaceURI}/${SUBAPP_CODES.shop}/product/${encodeURIComponent(product.slug)}`;

  // Per-line total from the numeric unit price (locale-safe).
  const unitNum = Number(price?.primary ?? 0);
  const qty = Number(item.quantity ?? 0);
  const lineTotal = Number.isFinite(unitNum) ? unitNum * qty : 0;

  return (
    <article className="bg-white border border-ink-100 rounded-2xl p-3.5 grid grid-cols-[92px_1fr_auto] gap-4 items-center shadow-xs">
      <Link
        href={productHref}
        className="w-[92px] h-[92px] rounded-[10px] overflow-hidden relative grid place-items-center"
        style={imageURL ? undefined : {background: getCategoryGradient(hue)}}>
        {imageURL ? (
          <Image
            src={imageURL}
            alt={i18n.tattr(product.name)}
            fill
            className="object-cover"
            sizes="92px"
          />
        ) : null}
      </Link>

      <div className="min-w-0">
        <Link
          href={productHref}
          className="block text-[15px] font-bold text-ink-900 leading-snug mb-1 line-clamp-2">
          {i18n.tattr(product.name)}
        </Link>
        {product.code && (
          <div className="text-xs text-ink-500 font-mono mb-2.5">
            {product.code}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-ink-150 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => onQtyChange(Math.max(1, qty - 1))}
              className="w-[30px] h-8 grid place-items-center text-base font-semibold text-ink-900 hover:bg-ink-25 transition-colors"
              aria-label="Decrement">
              −
            </button>
            <div className="w-9 text-center text-[13px] font-bold text-ink-900 tabular-nums">
              {qty}
            </div>
            <button
              type="button"
              onClick={() => onQtyChange(qty + 1)}
              className="w-[30px] h-8 grid place-items-center text-base font-semibold text-ink-900 hover:bg-ink-25 transition-colors"
              aria-label="Increment">
              +
            </button>
          </div>
          <span className="text-xs text-ink-500 tabular-nums">
            {price?.displayPrimary ?? '—'} {unitSuffix}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2.5">
        <span className="text-lg font-extrabold text-ink-900 tabular-nums">
          {fmt(lineTotal)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="w-8 h-8 rounded-md grid place-items-center text-status-rejected-fg hover:bg-status-rejected-bg transition-colors">
          <MdClose className="text-base" />
        </button>
      </div>
    </article>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline py-1 text-[13.5px]">
      <span className="text-ink-500">{label}</span>
      <span
        className={cn(
          'font-semibold tabular-nums',
          muted ? 'text-ink-500 text-[12px] font-normal' : 'text-ink-900',
        )}>
        {value}
      </span>
    </div>
  );
}
