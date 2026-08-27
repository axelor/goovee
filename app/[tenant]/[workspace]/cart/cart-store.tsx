'use client';

import {createContext, useCallback, useContext, useMemo, useRef} from 'react';

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
  /* Callers build the seed inline, so it is captured on the first render and
   * reused. Handing back a fresh object while the slice is still loading would
   * give the cart a new identity every render, and any consumer effect keyed on
   * the cart would re-run — and re-render — without settling. */
  const seedRef = useRef(fallback);
  const seed = seedRef.current;

  const value = (slice?.value as T | undefined) ?? seed;
  const loaded = slice?.loaded ?? false;

  const setValue = useCallback(
    (updater: (prev: T) => T) =>
      update(code, prev => updater((prev as T | null) ?? seed)),
    [update, code, seed],
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
