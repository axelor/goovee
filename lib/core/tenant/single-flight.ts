/**
 * Returns the promise already stored under `key`, or stores and returns the
 * outcome of `attempt`. Every caller that arrives while an attempt is in flight
 * shares it, so a cold key is worked on once however many ask at the same time.
 *
 * A rejected attempt stays stored for `cooldownMs` and is then dropped. Callers
 * in that window receive the same rejection instead of starting an attempt of
 * their own, and the first caller after the window tries again.
 */
export function shareAttempt<Key, Value>(
  store: Map<Key, Promise<Value>>,
  key: Key,
  attempt: () => Promise<Value>,
  cooldownMs: number,
): Promise<Value> {
  const stored = store.get(key);

  if (stored) {
    return stored;
  }

  /* Wrapped so that an attempt failing before its first await rejects the
   * stored promise like any other failure, rather than throwing past the store. */
  const pending = (async () => attempt())();
  store.set(key, pending);

  pending.catch(() => {
    const timer = setTimeout(() => {
      if (store.get(key) === pending) {
        store.delete(key);
      }
    }, cooldownMs);
    timer.unref?.();
  });

  return pending;
}
