export type MemoizeAsyncOptions = {
  /**
   * How long a rejected computation stays memoised before the next caller
   * recomputes it. A fulfilled one stays for the life of the store.
   */
  failureTtlMs: number;
};

/**
 * Memoises an async computation per key in the caller's store.
 *
 * The first caller for a key starts `compute` and stores the promise; every
 * caller that arrives while it is pending, and every caller after it fulfils,
 * receives that same promise. A rejected computation stays for `failureTtlMs`,
 * so callers in that window receive the same rejection instead of each
 * recomputing, and the first caller after the window computes again.
 */
export function memoizeAsync<Key, Value>(
  store: Map<Key, Promise<Value>>,
  key: Key,
  compute: () => Promise<Value>,
  {failureTtlMs}: MemoizeAsyncOptions,
): Promise<Value> {
  const stored = store.get(key);

  if (stored) {
    return stored;
  }

  /* Wrapped so that a computation failing before its first await rejects the
   * stored promise like any other failure, rather than throwing past the store. */
  const pending = (async () => compute())();
  store.set(key, pending);

  pending.catch(() => {
    const timer = setTimeout(() => {
      if (store.get(key) === pending) {
        store.delete(key);
      }
    }, failureTtlMs);
    timer.unref?.();
  });

  return pending;
}
