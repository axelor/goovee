'use client';

import {useCallback} from 'react';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {useCartSlice} from '@/app/[tenant]/[workspace]/cart/cart-store';

export type MarketplaceCartItem = {
  productId: string;
  productSlug: string;
  name: string;
  priceAti: number;
  currencySymbol: string | null;
  /** Decimal places to render priceAti at. From the product's saleCurrency. */
  scale?: number;
  /* Display-only snapshot, so a stored row renders without a server
   * roundtrip. These may go stale between
   * "add to cart" and checkout, which is fine — the server re-fetches
   * fresh values for price and ownership at checkout time. */
  description: string | null;
  iconCode: string | null;
  coverStyle: string | null;
  currentVersionNumber: string | null;
};

export type MarketplaceCart = {
  items: MarketplaceCartItem[];
};

function emptyCart(): MarketplaceCart {
  return {items: []};
}

/** Count semantics for the unified cart icon — this is the marketplace's
 *  `getCount` in the shared cart descriptors, which is why it takes `unknown`.
 *  Distinct products, not quantities. */
export function marketplaceCartCount(stored: unknown): number {
  const cart = stored as MarketplaceCart | null;
  return cart?.items?.length ?? 0;
}

/* Cart for the marketplace subapp. State lives in the shared CartProvider
 * (scoped to the logged-in user — items can only be added while signed in, so
 * a guest just gets an empty key); dedup and counting live here. */
export function useMarketplaceCart() {
  const {
    value: cart,
    loaded,
    setValue,
  } = useCartSlice<MarketplaceCart>(SUBAPP_CODES.marketplace, emptyCart());

  const addItem = useCallback(
    async (item: MarketplaceCartItem) => {
      await setValue(prev =>
        prev.items.some(cartItem => cartItem.productId === item.productId)
          ? prev
          : {...prev, items: [...prev.items, item]},
      );
    },
    [setValue],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      await setValue(prev => ({
        ...prev,
        items: prev.items.filter(cartItem => cartItem.productId !== productId),
      }));
    },
    [setValue],
  );

  const clearCart = useCallback(async () => {
    await setValue(() => emptyCart());
  }, [setValue]);

  const isInCart = useCallback(
    (productId: string) =>
      cart.items.some(cartItem => cartItem.productId === productId),
    [cart],
  );

  return {cart, loaded, addItem, removeItem, clearCart, isInCart};
}
