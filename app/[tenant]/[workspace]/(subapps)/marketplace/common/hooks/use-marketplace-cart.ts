'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

import {getitem, setitem} from '@/storage/local';

export type MarketplaceCartItem = {
  productId: string;
  productSlug: string;
  name: string;
  priceAti: number;
  currencySymbol?: string | null;
  /** Decimal places to render priceAti at. From the product's saleCurrency. */
  scale?: number;
  /* Display-only snapshot used by the cart row so it can render a richer
   * product card without a server roundtrip. These may go stale between
   * "add to cart" and checkout, which is fine — the server re-fetches
   * fresh values for price and ownership at checkout time. */
  description?: string | null;
  marketplaceIconCode?: string | null;
  marketplaceCoverStyle?: string | null;
  currentVersionNumber?: string | null;
};

export type MarketplaceCart = {
  items: MarketplaceCartItem[];
};

const CHANGED_EVENT = 'marketplace-cart-changed';

function emptyCart(): MarketplaceCart {
  return {items: []};
}

function storageKey(workspaceURL: string) {
  return `marketplace-cart-${workspaceURL}`;
}

/* localStorage-backed cart for the marketplace subapp. Same-tab updates
 * are broadcast via a custom DOM event so multiple components reading
 * the cart stay in sync without a context provider. Cross-tab sync is
 * out of scope (the shop cart doesn't do it either). */
export function useMarketplaceCart(workspaceURL: string) {
  const key = storageKey(workspaceURL);
  const [cart, setCart] = useState<MarketplaceCart>(emptyCart);
  const [loaded, setLoaded] = useState(false);
  /* Ref tracks the latest cart so the mutation helpers can read it
   * synchronously and return a promise that resolves only after the
   * storage write has flushed — callers like "Buy now" depend on the
   * write completing before they navigate. */
  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = (await getitem(key)) as MarketplaceCart | null;
      if (!cancelled) {
        setCart(data ?? emptyCart());
        setLoaded(true);
      }
    };
    load();
    const onChanged = () => load();
    window.addEventListener(CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(CHANGED_EVENT, onChanged);
    };
  }, [key]);

  const write = useCallback(
    async (next: MarketplaceCart) => {
      cartRef.current = next;
      setCart(next);
      await setitem(key, next);
      window.dispatchEvent(new Event(CHANGED_EVENT));
    },
    [key],
  );

  const addItem = useCallback(
    async (item: MarketplaceCartItem) => {
      const current = cartRef.current;
      if (current.items.some(i => i.productId === item.productId)) return;
      await write({...current, items: [...current.items, item]});
    },
    [write],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      const current = cartRef.current;
      await write({
        ...current,
        items: current.items.filter(i => i.productId !== productId),
      });
    },
    [write],
  );

  const clearCart = useCallback(async () => {
    await write(emptyCart());
  }, [write]);

  const isInCart = useCallback(
    (productId: string) => cart.items.some(i => i.productId === productId),
    [cart],
  );

  return {cart, loaded, addItem, removeItem, clearCart, isInCart};
}
