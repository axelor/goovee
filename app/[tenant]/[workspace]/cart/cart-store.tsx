'use client';

import {createContext, useCallback, useContext, useMemo} from 'react';

// ---- LOCAL IMPORTS ---- //
import type {CartSummary} from './storage';

/* The generic cart store: one slice per app cart, keyed by subapp code. It is
 * content-agnostic — a slice value is an opaque blob owned by that app's hook.
 * `CartProvider` (cart-provider.tsx) populates it; apps read/write a slice via
 * `useCartSlice`, and the unified icon reads counts via `useCartCounts`. */

export type CartSlice = {value: unknown; loaded: boolean};

export type CartStoreValue = {
  slices: Record<string, CartSlice>;
  update: (code: string, updater: (prev: unknown) => unknown) => Promise<void>;
};

export const CartStoreContext = createContext<CartStoreValue | null>(null);

export function useCartStore(): CartStoreValue {
  const store = useContext(CartStoreContext);
  if (!store) {
    throw new Error('useCartStore must be used within a CartProvider');
  }
  return store;
}

/**
 * Read/write a single app's cart slice. `fallback` seeds the value before the
 * store has loaded (and whenever the slice is empty). `setValue` takes a
 * functional updater so reads are never stale, and resolves once persisted.
 */
export function useCartSlice<T>(code: string, fallback: T) {
  const {slices, update} = useCartStore();
  const slice = slices[code];
  const value = (slice?.value as T | undefined) ?? fallback;
  const loaded = slice?.loaded ?? false;

  const setValue = useCallback(
    (updater: (prev: T) => T) =>
      update(code, prev => updater((prev as T | null) ?? fallback)),
    // `fallback` is the empty-state seed only; callers pass a fresh literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [update, code],
  );

  return {value, loaded, setValue};
}

/** Item counts for the unified cart icon, read from the store (no extra IO). */
export function useCartCounts(
  descriptors: CartSummary[],
): Record<string, number> {
  const {slices} = useCartStore();
  return useMemo(
    () =>
      Object.fromEntries(
        descriptors.map(descriptor => [
          descriptor.code,
          descriptor.getCount(slices[descriptor.code]?.value ?? null),
        ]),
      ),
    [descriptors, slices],
  );
}
