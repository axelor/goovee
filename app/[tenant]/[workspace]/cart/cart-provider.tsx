'use client';

import type {ReactNode} from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {authClient} from '@/lib/auth-client';
import {getitem, setitem} from '@/storage/local';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {CART_DESCRIPTORS} from './descriptors';
import {
  CartStoreContext,
  type CartSlice,
  type CartStoreValue,
} from './cart-store';

/**
 * Single, content-agnostic owner of every app cart's state. Mounted once at the
 * workspace root, it loads each registered cart from storage (running that
 * cart's optional one-time `init` — e.g. shop's guest→user merge and legacy-key
 * migration), is the sole writer, and exposes the slices through `CartStore`.
 * Each app layers its typed hook on top via `useCartSlice`.
 */
export default function CartProvider({children}: {children: ReactNode}) {
  const {workspaceURL} = useWorkspace();
  const {data: session, isPending: sessionPending} = authClient.useSession();
  const userId = session?.user?.id;

  const [slices, setSlices] = useState<Record<string, CartSlice>>({});
  /* Latest values for synchronous read-modify-write inside `update`. */
  const valuesRef = useRef<Record<string, unknown>>({});
  /* Latches once the session has settled. It only ever goes forward: while
   * there is no session `isPending` returns to true on every refetch — which
   * better-auth does on each window focus — and a guest refocusing a tab must
   * not send every cart back to unread. */
  const [sessionSettled, setSessionSettled] = useState(false);

  useEffect(() => {
    if (!sessionPending) setSessionSettled(true);
  }, [sessionPending]);

  useEffect(() => {
    /* Nothing loads until the session is known. Each cart is keyed by user, so
     * starting earlier would read the guest key, publish it as loaded, and then
     * throw it away and read again once the session arrived — which shows a
     * signed-in visitor an empty cart in between. */
    if (!sessionSettled) return;

    let cancelled = false;
    valuesRef.current = {};
    setSlices({});

    CART_DESCRIPTORS.forEach(async descriptor => {
      let value: unknown = null;
      try {
        const key = descriptor.storageKey(workspaceURL, userId);
        const raw = await getitem(key);
        value = descriptor.init
          ? await descriptor.init(raw, {workspaceURL, userId})
          : raw;
      } catch (err) {
        /* Never leave a cart permanently unloaded — fall back to empty. */
        console.error((err as Error)?.message);
      }
      if (cancelled) return;
      /* A mutation that landed before this load resolved already owns the slice;
       * don't clobber it with the stored value. (Mutating a cart before its
       * first load is a narrow race; callers gate add actions on `loaded`.) */
      if (descriptor.code in valuesRef.current) return;
      valuesRef.current[descriptor.code] = value;
      setSlices(prev => ({
        ...prev,
        [descriptor.code]: {value, loaded: true},
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceURL, userId, sessionSettled]);

  const update = useCallback(
    async (code: string, updater: (prev: unknown) => unknown) => {
      const descriptor = CART_DESCRIPTORS.find(entry => entry.code === code);
      if (!descriptor) return;
      const key = descriptor.storageKey(workspaceURL, userId);
      const next = updater(valuesRef.current[code] ?? null);
      valuesRef.current[code] = next;
      setSlices(prev => ({...prev, [code]: {value: next, loaded: true}}));
      await setitem(key, next);
    },
    [workspaceURL, userId],
  );

  const store = useMemo<CartStoreValue>(
    () => ({slices, update}),
    [slices, update],
  );

  return (
    <CartStoreContext.Provider value={store}>
      {children}
    </CartStoreContext.Provider>
  );
}
