import 'server-only';

import {AsyncLocalStorage} from 'node:async_hooks';

/** Who background work translates for, when there is no request to read it from. */
export type BackgroundScope = {tenant: string; locale: string};

const storage = new AsyncLocalStorage<BackgroundScope>();

/**
 * Runs work that has no request of its own — a job from the clock — so that
 * `t()` inside it translates for the named tenant and locale instead of
 * reading the request's headers and session, which would throw.
 */
export function runInBackground<T>(
  scope: BackgroundScope,
  work: () => Promise<T>,
): Promise<T> {
  return storage.run(scope, work);
}

/** The scope `runInBackground` set, if the caller is inside one. */
export function backgroundScope(): BackgroundScope | undefined {
  return storage.getStore();
}
