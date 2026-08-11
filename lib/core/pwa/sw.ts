/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import {defaultCache} from '@serwist/next/worker';
import type {PrecacheEntry, SerwistGlobalConfig} from 'serwist';
import {Serwist, StaleWhileRevalidate} from 'serwist';
import type {NotificationPayload} from './types';
import {PUSH_CHANNEL, MSG_TYPE} from './sw-constants';
import {normalizePathPrefix, withPathPrefix} from '@/lib/core/path/utils';

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    /* Locale translations: served from cache instantly, revalidated in the
     * background on every load. The API route sets ETag + Cache-Control:
     * no-cache, so the background fetch is a bodyless 304 via the browser
     * HTTP cache unless translations actually changed. Must be listed before
     * defaultCache to override the default NetworkFirst rule for /api/**. */
    {
      matcher: /\/api\/tenant\/[^/]+\/locales\//,
      handler: new StaleWhileRevalidate({
        cacheName: 'locale-translations',
      }),
    },
    ...defaultCache,
  ],
});

const channel = new BroadcastChannel(PUSH_CHANNEL);

/* The deployment base path, taken from this worker's own script URL: the worker
 * is served as `<basePath>/sw.js`, so dropping the filename leaves the base path
 * whatever scope it was registered at.
 *
 * It deliberately comes from neither of the two tempting alternatives. Not
 * `process.env.NEXT_PUBLIC_BASE_PATH`: `serwist build` bundles this file with
 * esbuild rather than Next, so nothing substitutes `process`, and reading it in a
 * worker throws at evaluation — which fails the install and leaves an already
 * installed worker pinned to its old version. Not `registration.scope` either:
 * that may carry the tenant (`<basePath>/<tenant>/`), and every path below is
 * addressed from the deployment root instead — the icons are origin-level assets
 * and the read endpoints are `/api/tenant/<id>/…`, so a scope prefix would insert
 * the tenant where it does not belong, or a second time. A server-supplied url
 * already names its own tenant, and an absolute one is passed through untouched
 * by withPathPrefix's SKIP_PATH_PREFIX guard. */
const basePath = normalizePathPrefix(
  new URL(self.location.href).pathname.replace(/\/[^/]*$/, ''),
);

function withDeploymentBasePath(path: string) {
  return withPathPrefix(basePath, path);
}

self.addEventListener('push', event => {
  const data: NotificationPayload | undefined = event.data?.json();
  if (!data) return;

  const title = data.title || 'Notification';
  const options: NotificationOptions & {renotify?: boolean} = {
    body: data.body,
    icon: data.icon ?? withDeploymentBasePath('/pwa/icons/icon-192x192.png'),
    badge: data.badge ?? withDeploymentBasePath('/pwa/icons/icon-72x72.png'),
    dir: data.dir,
    lang: data.lang,
    requireInteraction: data.requireInteraction,
    silent: data.silent,
    // Notifications sharing the same tag replace each other in the OS tray
    // instead of stacking. renotify ensures the user is still alerted.
    // Note: renotify is not supported in all browsers (e.g. Firefox ignores it).
    tag: data.tag,
    renotify: Boolean(data.tag),
    data: {
      url: data.url || '/',
      notification: data.notification,
      tenantId: data.tenantId,
      workspaceURL: data.workspaceURL,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));

  // Forward the new notification to all tabs so they can update state without a refetch
  channel.postMessage({
    type: MSG_TYPE.NEW,
    notification: data.notification,
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const handleClick = async () => {
    const {url, notification, tenantId} = event.notification.data;
    const tag = event.notification.tag;
    if (tenantId) {
      try {
        const readUrl = withDeploymentBasePath(
          tag
            ? `/api/tenant/${tenantId}/push/notifications/read/tag/${encodeURIComponent(tag)}`
            : `/api/tenant/${tenantId}/push/notifications/read/${notification?.id}`,
        );
        await fetch(readUrl, {method: 'POST'});
        // Notify all tabs to remove this notification from their unread state
        channel.postMessage({type: MSG_TYPE.READ, notification, tag});
      } catch (err) {
        console.error('Failed to mark notification as read from SW:', err);
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(withDeploymentBasePath(url || '/'));
    }
  };

  event.waitUntil(handleClick());
});

channel.onmessage = async event => {
  if (event.data?.type === MSG_TYPE.CLOSE) {
    const {notificationId} = event.data;
    if (notificationId) {
      const notifications = await self.registration.getNotifications();
      notifications
        .filter(n => n.data?.notification?.id === notificationId)
        .forEach(n => n.close());
    }
  } else if (event.data?.type === MSG_TYPE.CLOSE_ALL) {
    const notifications = await self.registration.getNotifications();
    notifications.forEach(n => n.close());
  }
};

serwist.addEventListeners();
