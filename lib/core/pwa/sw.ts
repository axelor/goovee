/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import {defaultCache} from '@serwist/next/worker';
import type {PrecacheEntry, SerwistGlobalConfig} from 'serwist';
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist';
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

const scopeBasePath = normalizePathPrefix(
  new URL(self.registration.scope).pathname,
);

function withScopeBasePath(path: string) {
  return withPathPrefix(scopeBasePath, path);
}

/*
 * Where the PDF reader's own files are served from: the application's own root,
 * then `pdfjs`, then the version they belong to.
 *
 * Both parts are checked. A tenant is named by the first part of an address and
 * a workspace by the second, so either may be called `pdfjs`, and their pages
 * and documents must not be mistaken for static files — those are answered from
 * a held copy without checking that whoever asks may still see them.
 */
const PDF_READER_PATH = withScopeBasePath('/pdfjs/');
const PDF_READER_VERSION = /^\d+\.\d+\.\d+\//;

function isPDFReaderAsset(url: URL): boolean {
  if (url.origin !== self.location.origin) return false;
  if (!url.pathname.startsWith(PDF_READER_PATH)) return false;
  return PDF_READER_VERSION.test(url.pathname.slice(PDF_READER_PATH.length));
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    /* Locale translations: served from cache instantly, revalidated in the
     * background on every load. The API routes set ETag + Cache-Control:
     * no-cache, so the background fetch is a bodyless 304 via the browser
     * HTTP cache unless translations actually changed. Must be listed before
     * defaultCache to override the default NetworkFirst rule for /api/**. */
    {
      matcher: /\/api\/(tenant\/[^/]+\/)?locales\//,
      handler: new StaleWhileRevalidate({
        cacheName: 'locale-translations',
      }),
    },
    /* Displayed images, which are served by the routes that hold the files and
     * so are addressed as `…?w=…` rather than by a path a file extension can be
     * read from. Without a rule of their own they fall into the buckets meant
     * for API responses and pages, and a single gallery evicts everything those
     * hold. Must be listed before defaultCache for the same reason as above.
     *
     * Fetched from the network first, and only fetched from the cache when there
     * is no network. These images are shown to whoever may see them, which is
     * decided per request; serving one from the cache first would answer from a
     * copy kept after that decision was last made. The route revalidates with an
     * ETag, so a repeat view is a bodyless response rather than a transfer. */
    {
      matcher: ({request, url}) =>
        request.destination === 'image' && url.searchParams.has('w'),
      handler: new NetworkFirst({
        cacheName: 'display-images',
        plugins: [
          new ExpirationPlugin({maxEntries: 128, maxAgeSeconds: 24 * 60 * 60}),
        ],
      }),
    },
    /* The PDF reader's own files. They are left out of the set downloaded with
     * the application because there are close to two hundred of them and a
     * given installation opens one or two, so they are kept as they are needed
     * instead. Answered from the cache without asking first, which is safe
     * because the address carries the reader's version: an upgrade asks for
     * different addresses rather than expecting different bytes at the same
     * one. Held generously enough that the worker cannot be pushed out by a
     * document that pulls in many character maps. */
    {
      matcher: ({url}) => isPDFReaderAsset(url),
      handler: new CacheFirst({
        cacheName: 'pdf-reader',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 256,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

const channel = new BroadcastChannel(PUSH_CHANNEL);

self.addEventListener('push', event => {
  const data: NotificationPayload | undefined = event.data?.json();
  if (!data) return;

  /* body, url and tag arrive at the top level only, so they are not paid for
   * twice against the payload limit. Put them back before anything downstream
   * treats this as a whole notification record. */
  const record = data.notification && {
    ...data.notification,
    body: data.body ?? null,
    url: data.url ?? null,
    tag: data.tag ?? null,
  };

  const title = data.title || 'Notification';
  const options: NotificationOptions & {renotify?: boolean} = {
    body: data.body,
    icon: data.icon ?? withScopeBasePath('/pwa/icons/icon-192x192.png'),
    badge: data.badge ?? withScopeBasePath('/pwa/icons/icon-72x72.png'),
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
      notification: record,
      tenantId: data.tenantId,
      workspaceURL: data.workspaceURL,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));

  // Forward the new notification to all tabs so they can update state without a refetch
  channel.postMessage({
    type: MSG_TYPE.NEW,
    notification: record,
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const handleClick = async () => {
    const {url, notification, tenantId} = event.notification.data;
    const tag = event.notification.tag;
    /* Without a tag or an id there is nothing to mark — the record it belongs to
     * was never stored. Interpolating a missing id would ask the server to read
     * a notification called "undefined". */
    const readPath = tag
      ? `/api/tenant/${tenantId}/push/notifications/read/tag/${encodeURIComponent(tag)}`
      : notification?.id
        ? `/api/tenant/${tenantId}/push/notifications/read/${notification.id}`
        : null;

    if (tenantId && readPath) {
      try {
        await fetch(withScopeBasePath(readPath), {method: 'POST'});
        // Notify all tabs to remove this notification from their unread state
        channel.postMessage({type: MSG_TYPE.READ, notification, tag});
      } catch (err) {
        console.error('Failed to mark notification as read from SW:', err);
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(withScopeBasePath(url || '/'));
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
