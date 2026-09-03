'use client';

import {useState} from 'react';
import Image from 'next/image';
import {Link} from '@/ui/components/link';
import {MdAddShoppingCart, MdCheck} from 'react-icons/md';

import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useCart} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/context/cart-context';
import {useToast} from '@/ui/hooks';
import {getProductImageURL} from '@/utils/files';
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import type {ComputedProduct} from '@/types';

import {
  getCategoryGradient,
  getCategoryHue,
} from '@/subapps/shop/common/utils/category-style';
import {PriceWarning} from '@/subapps/shop/common/ui/components/price-warning';

export interface ShopCategory {
  id: string | number;
  name: string | null;
  slug?: string | null;
  /* Portal categories form a tree. The query already nests each category under
     its parent, so the catalogue reads `items` rather than rebuilding the tree;
     `parent` tells it which categories are roots. */
  parent?: {id: string | number} | null;
  items?: ShopCategory[];
}

export function ShopProductCard({
  product,
  category,
  inStockLabel,
  outOfStockLabel,
  addToCartLabel,
  addedLabel,
  hidePriceAndPurchase,
  displayPrices,
}: {
  product: ComputedProduct;
  category: ShopCategory | null;
  inStockLabel: string;
  outOfStockLabel: string;
  addToCartLabel: string;
  addedLabel: string;
  hidePriceAndPurchase?: boolean;
  displayPrices?: boolean;
}) {
  const {tenant, scope} = useWorkspace();
  const {loaded: cartLoaded, updateQuantity, getProductQuantity} = useCart();
  const {toast} = useToast();

  const p = product?.product ?? product;
  const price = product?.price;
  // Only surface the out-of-stock badge when the workspace policy asks to
  // notify the user (showMessage) — the "allow buy, no message" policy must
  // not display a rupture badge even though the item is technically unavailable.
  const outOfStock =
    !!p?.outOfStockConfig?.outOfStock && !!p?.outOfStockConfig?.showMessage;
  /* Only the product's own availability. A reader who may not buy at all is
   * handled by leaving the control out, the way the product page does — a
   * disabled button says nothing about why it cannot be used, whereas the badge
   * beside it does explain being out of stock. */
  const canBuy = !!p?.outOfStockConfig?.canBuy;

  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const imageId = p?.thumbnailImage?.id || p?.images?.[0];
  const imageURL = imageId ? getProductImageURL(imageId, tenant) : null;

  const categoryName = category?.name ?? null;
  const hue = getCategoryHue(categoryName);

  const href = category?.slug
    ? scope.forRouter(`/shop/category/${category.slug}/product/${p.slug}`)
    : scope.forRouter(`/shop/product/${p.slug}`);

  const handleAdd = async (e: React.MouseEvent) => {
    // Card is wrapped in <Link> — stop the click from navigating to the
    // product detail when the user hits the add-to-cart button.
    e.preventDefault();
    e.stopPropagation();
    /* Adding before the stored cart has been read would build the new cart from
     * an empty one and persist that over what is in storage. */
    if (hidePriceAndPurchase || !canBuy || adding || !cartLoaded) return;
    setAdding(true);
    try {
      const existing = await getProductQuantity(p.id);
      await updateQuantity({
        productId: p.id,
        quantity: (existing || 0) + 1,
        computedProduct: product,
        images: (p.images ?? []).map(String),
      });
      toast({title: i18n.t('Added to cart')});
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link
      href={href}
      className={cn(
        'group bg-white border border-ink-100 rounded-xl overflow-hidden',
        'flex flex-col transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-soft-md',
      )}>
      <div
        className="relative h-[140px] grid place-items-center"
        style={imageURL ? undefined : {background: getCategoryGradient(hue)}}>
        {imageURL ? (
          <Image
            src={imageURL}
            alt={i18n.tattr(p.name)}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          />
        ) : null}
        {categoryName && (
          <span
            className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.04em] bg-white/95 text-royal-dark"
            style={{
              color: imageURL ? undefined : `hsl(${hue}, 60%, 25%)`,
            }}>
            {categoryName}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3.5 flex-1">
        <h3 className="m-0 text-[13px] font-bold text-ink-900 leading-[1.3] min-h-[34px] line-clamp-2">
          {i18n.tattr(p.name)}
        </h3>
        {p.code && (
          <div className="text-[10.5px] text-ink-500 font-mono">{p.code}</div>
        )}
        <div className="mt-auto pt-2 border-t border-ink-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-extrabold text-ink-900 tabular-nums">
              {displayPrices && !hidePriceAndPurchase
                ? (price?.displayPrimary ?? '—')
                : null}
            </div>
            {displayPrices &&
              !hidePriceAndPurchase &&
              price?.displayTwoPrices &&
              price?.displaySecondary && (
                <div className="text-[10.5px] text-ink-500 tabular-nums">
                  {price.displaySecondary}
                </div>
              )}
            {displayPrices && !hidePriceAndPurchase && (
              <PriceWarning
                errorMessage={product?.errorMessage}
                className="mt-0.5 text-[10px]"
              />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.04em] px-1.5 py-0.5 rounded',
                outOfStock
                  ? 'bg-status-rejected-bg text-status-rejected-fg'
                  : 'bg-mint-50 text-mint-700',
              )}>
              {outOfStock ? outOfStockLabel : inStockLabel}
            </span>
            {!hidePriceAndPurchase && (
              <button
                type="button"
                onClick={handleAdd}
                disabled={!canBuy || adding || !cartLoaded}
                aria-label={justAdded ? addedLabel : addToCartLabel}
                title={justAdded ? addedLabel : addToCartLabel}
                className={cn(
                  'inline-grid place-items-center w-9 h-9 rounded-lg transition-colors shrink-0',
                  !canBuy
                    ? 'bg-ink-100 text-ink-400 cursor-not-allowed'
                    : justAdded
                      ? 'bg-mint-50 text-mint-700'
                      : 'bg-royal text-white hover:bg-royal-dark',
                  canBuy &&
                    (adding || !cartLoaded) &&
                    'opacity-70 cursor-not-allowed',
                )}>
                {justAdded ? (
                  <MdCheck className="text-base" />
                ) : (
                  <MdAddShoppingCart className="text-base" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
