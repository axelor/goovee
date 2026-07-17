'use client';

import {useEffect, useMemo, useState} from 'react';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {MdClose, MdDescription, MdExpandMore, MdPlace} from 'react-icons/md';

import {SUBAPP_CODES, ADDRESS_TYPE} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {useToast} from '@/ui/hooks';
import {i18n} from '@/locale';
import {getProductImageURL} from '@/utils/files';
import {cn} from '@/utils/css';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/ui/components/dialog';
import {
  findDefaultDelivery,
  fetchDeliveryAddresses,
} from '@/subapps/shop/common/actions/address';
import {
  getCategoryGradient,
  getCategoryHue,
} from '@/subapps/shop/common/utils/category-style';
import {requestQuotation} from '@/subapps/shop/common/actions/cart';

export interface ShopQuoteModalLabels {
  headerTitle: string;
  headerSubtitle: string;
  itemsTitle: string;
  moreItemsPrefix: string;
  moreItemsSuffix: string;
  estimatedTotalLabel: string;
  htSuffix: string;
  addressTitle: string;
  addressDefaultBadge: string;
  addressChooseAnother: string;
  addressNoneTitle: string;
  addressLoading: string;
  cancel: string;
  submit: string;
  closeLabel: string;
  addressMissing: string;
  successTitle: string;
  errorTitle: string;
  submitting: string;
}

const ITEMS_PREVIEW_COUNT = 3;

export function ShopQuoteModal({
  open,
  onOpenChange,
  computedItems,
  quotationSubapp,
  labels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  computedItems: any[];
  quotationSubapp: boolean;
  labels: ShopQuoteModalLabels;
}) {
  const {workspaceURI, workspaceURL} = useWorkspace();
  const {cart, clearCart} = useCart();
  const {toast} = useToast();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);

  // Reset state each time the modal opens so we start fresh.
  useEffect(() => {
    if (open) {
      setSubmitting(false);
    }
  }, [open]);

  const subtotalHt = useMemo(() => {
    let sum = 0;
    for (const item of computedItems) {
      const raw = item.computedProduct?.price?.displayPrimary ?? '';
      const cleaned = String(raw)
        .replace(/[^\d.,-]/g, '')
        .replace(/\s/g, '');
      const normalised = cleaned
        .replace(/\.(?=\d{3}(?:[^\d]|$))/g, '')
        .replace(',', '.');
      const n = Number(normalised);
      if (Number.isFinite(n)) sum += n * Number(item.quantity ?? 0);
    }
    return sum;
  }, [computedItems]);

  const currency =
    computedItems[0]?.computedProduct?.product?.saleCurrency?.symbol ?? '€';
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(n)
      .concat(' ', currency);

  const handleSubmit = async () => {
    if (!(cart?.invoicingAddress && cart?.deliveryAddress)) {
      toast({variant: 'destructive', title: labels.addressMissing});
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestQuotation({cart, workspaceURL});
      if ((res as any)?.data) {
        toast({variant: 'success', title: labels.successTitle});
        clearCart();
        const redirectURL = quotationSubapp
          ? `${workspaceURI}/${SUBAPP_CODES.quotations}/${(res as any).data}`
          : `${workspaceURI}/${SUBAPP_CODES.shop}`;
        onOpenChange(false);
        router.replace(redirectURL);
      } else {
        toast({variant: 'destructive', title: labels.errorTitle});
        setSubmitting(false);
      }
    } catch {
      toast({variant: 'destructive', title: labels.errorTitle});
      setSubmitting(false);
    }
  };

  const previewItems = computedItems.slice(0, ITEMS_PREVIEW_COUNT);
  const overflow = Math.max(0, computedItems.length - ITEMS_PREVIEW_COUNT);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogContent
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-[560px] translate-x-[-50%] translate-y-[-50%]',
            'p-0 border-0 bg-white rounded-2xl shadow-soft-md overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            'max-h-[90vh] flex flex-col',
          )}
          hideClose>
          <DialogTitle className="sr-only">{labels.headerTitle}</DialogTitle>

          {/* Gradient header */}
          <header
            className="relative text-white px-6 py-5 shrink-0"
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--royal-dark)) 0%, hsl(var(--royal)) 100%)',
            }}>
            <svg
              viewBox="0 0 600 200"
              preserveAspectRatio="none"
              aria-hidden
              className="absolute inset-0 w-full h-full opacity-[0.12]">
              <g fill="#fff">
                {Array.from({length: 60}).map((_, i) => {
                  const x = (i * 53) % 600;
                  const y = ((i * 31) % 200) + 8;
                  return <circle key={i} cx={x} cy={y} r="1.4" />;
                })}
              </g>
            </svg>
            <div className="relative flex items-center gap-3.5">
              <span
                className="grid place-items-center w-11 h-11 rounded-xl bg-white/15"
                style={{border: '1px solid rgba(255,255,255,0.25)'}}>
                <MdDescription className="text-lg" />
              </span>
              <div>
                <h2 className="m-0 text-lg font-extrabold tracking-[-0.015em]">
                  {labels.headerTitle}
                </h2>
                <p className="m-0 mt-0.5 text-[12.5px] text-white/85">
                  {labels.headerSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={labels.closeLabel}
                className="ml-auto shrink-0 w-8 h-8 rounded-full grid place-items-center bg-white/15 hover:bg-white/25 transition-colors text-white">
                <MdClose className="text-base" />
              </button>
            </div>
          </header>

          {/* Body scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            {/* Items recap */}
            <section>
              <h3 className="m-0 mb-2.5 text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-ink-500">
                {labels.itemsTitle}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {previewItems.map((item: any) => (
                  <QuoteItemRow
                    key={item.computedProduct.product.id}
                    item={item}
                    fmt={fmt}
                  />
                ))}
              </ul>
              {overflow > 0 && (
                <p className="m-0 mt-2 text-[12px] text-ink-500">
                  {labels.moreItemsPrefix} {overflow} {labels.moreItemsSuffix}
                </p>
              )}
              <div className="mt-3.5 flex items-baseline justify-between bg-ink-25 border border-ink-100 rounded-lg px-3.5 py-2.5">
                <span className="text-[12.5px] font-bold uppercase tracking-[0.04em] text-ink-700">
                  {labels.estimatedTotalLabel}
                </span>
                <span className="text-[18px] font-extrabold text-ink-900 tabular-nums">
                  {fmt(subtotalHt)}{' '}
                  <span className="text-[12px] font-semibold text-ink-500">
                    {labels.htSuffix}
                  </span>
                </span>
              </div>
            </section>

            {/* Address */}
            <section>
              <h3 className="m-0 mb-2.5 text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-ink-500">
                {labels.addressTitle}
              </h3>
              <QuoteAddressPicker
                defaultBadgeLabel={labels.addressDefaultBadge}
                chooseAnotherLabel={labels.addressChooseAnother}
                noneTitle={labels.addressNoneTitle}
                loadingLabel={labels.addressLoading}
              />
            </section>
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-ink-100 bg-ink-25 shrink-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="px-5 py-2.5 rounded-[10px] bg-white text-ink-700 border border-ink-150 text-sm font-semibold hover:bg-ink-25 transition-colors disabled:opacity-60">
              {labels.cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold text-white',
                'bg-royal hover:bg-royal-dark transition-colors',
                'disabled:opacity-70 disabled:cursor-not-allowed',
              )}
              style={{
                boxShadow:
                  '0 1px 2px rgba(13,30,75,0.15), 0 4px 12px rgba(13,30,75,0.12)',
              }}>
              <MdDescription className="text-base" />
              {submitting ? labels.submitting : labels.submit}
            </button>
          </footer>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

function QuoteItemRow({item, fmt}: {item: any; fmt: (n: number) => string}) {
  const {tenant} = useWorkspace();
  const product = item.computedProduct.product;
  const portalCat = product?.portalCategorySet?.[0];
  const productCat = product?.productCategory;
  const cat = portalCat ?? productCat ?? null;
  const catName = cat?.name ?? null;
  const hue = getCategoryHue(catName);

  const imageId = product?.thumbnailImage?.id || product?.images?.[0];
  const imageURL = imageId ? getProductImageURL(imageId, tenant) : null;

  const rawPrice = String(item.computedProduct?.price?.displayPrimary ?? '');
  const cleaned = rawPrice.replace(/[^\d.,-]/g, '').replace(/\s/g, '');
  const normalised = cleaned
    .replace(/\.(?=\d{3}(?:[^\d]|$))/g, '')
    .replace(',', '.');
  const unitNum = Number(normalised);
  const qty = Number(item.quantity ?? 0);
  const lineTotal = Number.isFinite(unitNum) ? unitNum * qty : 0;

  return (
    <li className="flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-lg overflow-hidden grid place-items-center relative shrink-0"
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
        <div className="text-[13px] font-semibold text-ink-900 truncate">
          {i18n.tattr(product.name)}
        </div>
        <div className="text-[11.5px] text-ink-500 tabular-nums">
          {qty} × {item.computedProduct?.price?.displayPrimary ?? '—'}
        </div>
      </div>
      <span className="text-[13px] font-bold text-ink-900 tabular-nums shrink-0">
        {fmt(lineTotal)}
      </span>
    </li>
  );
}

function QuoteAddressPicker({
  defaultBadgeLabel,
  chooseAnotherLabel,
  noneTitle,
  loadingLabel,
}: {
  defaultBadgeLabel: string;
  chooseAnotherLabel: string;
  noneTitle: string;
  loadingLabel: string;
}) {
  const {cart, updateAddress} = useCart();
  const {workspaceURL} = useWorkspace();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load delivery addresses once and seed selection. For a quote request we use
  // a single address (same id for delivery + invoicing on the cart).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, def] = await Promise.all([
          fetchDeliveryAddresses({workspaceURL}),
          findDefaultDelivery({workspaceURL}),
        ]);
        if (cancelled) return;
        const all = (list as any[]) ?? [];
        setAddresses(all);
        const cartId = cart?.deliveryAddress ?? cart?.invoicingAddress ?? null;
        const initial =
          (cartId && all.find(a => String(a.id) === String(cartId))) ||
          (def as any) ||
          all[0] ||
          null;
        if (initial?.id) {
          setSelectedId(String(initial.id));
          if (cart?.deliveryAddress !== initial.id) {
            updateAddress({
              addressType: ADDRESS_TYPE.delivery,
              address: initial.id,
            });
          }
          if (cart?.invoicingAddress !== initial.id) {
            updateAddress({
              addressType: ADDRESS_TYPE.invoicing,
              address: initial.id,
            });
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
    updateAddress({addressType: ADDRESS_TYPE.delivery, address: addr.id});
    updateAddress({addressType: ADDRESS_TYPE.invoicing, address: addr.id});
    setPicking(false);
  };

  const current =
    addresses.find(a => String(a.id) === selectedId) ?? addresses[0] ?? null;

  if (loading) {
    return (
      <div className="rounded-xl bg-royal-pale/60 border border-royal-border px-4 py-3.5 text-[12.5px] text-ink-500">
        {loadingLabel}…
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-xl bg-royal-pale/60 border border-royal-border px-4 py-3.5 text-[13px] text-ink-700">
        <div className="flex items-center gap-2.5">
          <MdPlace className="text-base text-royal shrink-0" />
          {noneTitle}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-royal-pale/60 border border-royal-border overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-white border border-royal-border text-royal shrink-0">
          <MdPlace className="text-base" />
        </span>
        <div className="flex-1 min-w-0">
          <AddressLines address={current.address} />
          {current.isDefaultDelivery || current.isDefaultInvoicing ? (
            <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full bg-white text-royal-dark border border-royal-border text-[10.5px] font-bold uppercase tracking-[0.04em]">
              {defaultBadgeLabel}
            </span>
          ) : null}
        </div>
        {addresses.length > 1 && (
          <button
            type="button"
            onClick={() => setPicking(p => !p)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-royal-dark text-[12px] font-bold hover:bg-white transition-colors shrink-0">
            {chooseAnotherLabel}
            <MdExpandMore
              className={cn(
                'text-sm transition-transform',
                picking && 'rotate-180',
              )}
            />
          </button>
        )}
      </div>
      {picking && addresses.length > 1 && (
        <div className="border-t border-royal-border bg-white max-h-[200px] overflow-y-auto p-1.5">
          {addresses.map(a => {
            const active = String(a.id) === selectedId;
            return (
              <label
                key={a.id}
                className={cn(
                  'flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                  active ? 'bg-royal-pale' : 'hover:bg-ink-25',
                )}>
                <input
                  type="radio"
                  name="quote-address"
                  checked={active}
                  onChange={() => handleSelect(a)}
                  className="w-4 h-4 mt-0.5 accent-royal cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <AddressLines address={a.address} />
                  {(a.isDefaultDelivery || a.isDefaultInvoicing) && (
                    <span className="inline-flex items-center mt-1 px-1.5 py-px rounded bg-ink-50 text-ink-600 text-[10px] font-bold uppercase tracking-[0.04em]">
                      {defaultBadgeLabel}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
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
