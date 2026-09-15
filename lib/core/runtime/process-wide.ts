/*
 * The server is built as two module graphs — route handlers, the middleware and
 * instrumentation in one, page renders in the other — and in development a
 * recompile evaluates a module again. Module-level state therefore exists once
 * per evaluation, which for anything that must be one per process (a pool, a
 * registry, a set of subscribers) means two or more of it. `globalThis` is the
 * one object every evaluation shares, so this is where such state is kept.
 */
declare global {
  var __processWide: Map<string, unknown> | undefined;
}

/**
 * The single value the process holds under `key`, created on first request and
 * returned as is afterwards, from whichever module graph or recompile asks.
 *
 * Keys are global to the process, so qualify them by module — `tenant/registry`,
 * `notification/mail-pools` — and never reuse one for another type: the store
 * cannot check that the value under a key is what the caller expects.
 */
export function processWide<Value>(key: string, create: () => Value): Value {
  const store = (globalThis.__processWide ??= new Map<string, unknown>());

  if (!store.has(key)) {
    store.set(key, create());
  }

  return store.get(key) as Value;
}
