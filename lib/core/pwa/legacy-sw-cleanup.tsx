'use client';

import {useEffect} from 'react';

import {withBasePath} from '@/lib/core/path/base-path';

/*
 * One-time upgrade cleanup. The pre-multi-tenancy build registered a single
 * origin/base-scoped service worker. The new per-tenant worker is scoped to
 * `/<tenant>/`, which does NOT replace the old registration (registrations are
 * keyed by scope), so an upgraded browser keeps the legacy worker controlling
 * `/` and `/auth` plus its origin-wide push subscription.
 *
 * Unregister any service worker that is NOT tenant-scoped — i.e. whose scope
 * is the origin/base root (or anything outside `<basePath>/<tenant>/`) — while
 * leaving every per-tenant registration intact (a browser signed into several
 * tenants may legitimately have more than one). Unregistering also drops the
 * worker's stale push subscription; the server prunes its record on the next
 * send (410 Gone). Caches are intentionally left alone: the old and new worker
 * share `/sw.js`, so cache names can collide and the orphaned caches are inert
 * once the worker is gone.
 *
 * This is lingering migration code: it is idempotent (a no-op once a browser is
 * clean) but cannot detect that every browser has run it, so remove it manually
 * once the upgrade window has passed (target: a release or two after deploy).
 */
export function LegacyServiceWorkerCleanup() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    /* The path prefix every per-tenant scope must extend, e.g. '/' or
     * '/portal/'. A registration is tenant-scoped only if its scope has a
     * segment beyond this prefix. */
    const basePrefix = new URL(withBasePath('/'), window.location.origin)
      .pathname;

    navigator.serviceWorker
      .getRegistrations()
      .then(registrations => {
        for (const registration of registrations) {
          const scopePath = new URL(registration.scope).pathname;
          const afterBase = scopePath.startsWith(basePrefix)
            ? scopePath.slice(basePrefix.length)
            : '';
          const isTenantScoped = afterBase.length > 0;
          if (!isTenantScoped) {
            void registration.unregister();
          }
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
