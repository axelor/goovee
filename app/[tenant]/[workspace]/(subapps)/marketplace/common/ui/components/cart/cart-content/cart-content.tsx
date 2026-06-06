'use client';

import {Button} from '@/ui/components';
import Link from 'next/link';
import {useMarketplaceCart} from '../../../../hooks/use-marketplace-cart';
import {CartItemCard} from '../cart-item-card';

type Props = {
  /** Root URL of the marketplace subapp — used to build product links. */
  marketplaceBase: string;
  emptyLabel: string;
  browseLabel: string;
  subtotalLabel: string;
  proceedLabel: string;
  removeLabel: string;
  /** Where the empty-cart "Browse marketplace" button links to (the
   *  default listing under the marketplace root). */
  browseHref: string;
  checkoutHref: string;
};

/* Decimal-aware formatter using whatever scale the item was added with.
 * Each cart row may have its own currency symbol; we show it inline. */
function formatPrice(
  value: number,
  scale = 2,
  currencySymbol: string | null = null,
) {
  const amount = value.toLocaleString(undefined, {
    minimumFractionDigits: scale,
    maximumFractionDigits: scale,
  });
  return currencySymbol ? `${amount} ${currencySymbol}` : amount;
}

export function CartContent({
  marketplaceBase,
  emptyLabel,
  browseLabel,
  subtotalLabel,
  proceedLabel,
  removeLabel,
  browseHref,
  checkoutHref,
}: Props) {
  const {cart, loaded, removeItem} = useMarketplaceCart();

  if (!loaded) {
    return <div className="h-32 rounded-lg bg-muted/40 animate-pulse" />;
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground mb-4">{emptyLabel}</p>
        <Button asChild>
          <Link href={browseHref}>{browseLabel}</Link>
        </Button>
      </div>
    );
  }

  /* All cart items should share a currency since saleCurrency is pinned
   * to the workspace default at product-create time. We pick the first
   * item's currency for the subtotal display; checkout enforces this. */
  const firstSymbol = cart.items[0]?.currencySymbol ?? undefined;
  const firstScale = cart.items[0]?.scale ?? 2;
  const subtotal = cart.items.reduce((sum, item) => sum + item.priceAti, 0);

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {cart.items.map(item => {
          const productHref = `${marketplaceBase}/products/${item.productSlug}`;
          return (
            <li key={item.productId}>
              <CartItemCard
                item={item}
                productHref={productHref}
                formatPrice={formatPrice}
                onRemove={removeItem}
                removeLabel={removeLabel}
              />
            </li>
          );
        })}
      </ul>

      <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-sm text-muted-foreground">{subtotalLabel}</span>
          <span className="text-lg font-semibold">
            {formatPrice(subtotal, firstScale, firstSymbol)}
          </span>
        </div>
        <Button asChild>
          <Link href={checkoutHref}>{proceedLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
