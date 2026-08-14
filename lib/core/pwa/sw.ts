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
import {pushChannelName, MSG_TYPE} from './sw-constants';
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

/* The deployment base path, taken from this worker's own script URL: it is
 * served as `<basePath>/sw.js`, so dropping the filename leaves the base path,
 * whatever scope it was registered at.
 *
 * Not `process.env.NEXT_PUBLIC_BASE_PATH`: `serwist build` bundles this file
 * with esbuild rather than Next, so nothing substitutes `process` and reading it
 * throws while the worker is evaluated, which fails the install and leaves the
 * previously installed worker in place. Not `registration.scope` either: that
 * may carry the tenant, while the paths built below are origin-level assets or
 * already name the tenant they belong to. */
const basePath = normalizePathPrefix(
  new URL(self.location.href).pathname.replace(/\/[^/]*$/, ''),
);

function withDeploymentBasePath(path: string) {
  return withPathPrefix(basePath, path);
}

/**
 * The tenant this worker was registered for, taken from its scope.
 *
 * Cache storage is per origin, not per scope, so every tenant's registration of
 * this same script would otherwise share one cache and one entry budget: opening
 * a gallery in one tenant would evict another tenant's held images. Naming the
 * caches after the tenant gives each registration a budget of its own.
 */
const scopeTenant =
  decodeSegment(
    normalizePathPrefix(new URL(self.registration.scope).pathname).slice(
      basePath.length,
    ),
  ) || '/';

/* A `%` that is not a valid escape survives into the pathname undecoded, and
 * decoding it throws. Nothing evaluated at this level may throw: it would fail
 * the install and leave the previously installed worker in place. Falling back
 * to the raw segment costs this tenant its channel and nothing more. */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function tenantCacheName(name: string) {
  return `${name}${scopeTenant}`;
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
const PDF_READER_PATH = withDeploymentBasePath('/pdfjs/');
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
     * background on every load. The API route sets ETag + Cache-Control:
     * no-cache, so the background fetch is a bodyless 304 via the browser
     * HTTP cache unless translations actually changed. Must be listed before
     * defaultCache to override the default NetworkFirst rule for /api/**.
     *
     * No plugin is passed on purpose. A bundle the route could not complete is
     * answered 503 carrying the wording it fell back to, so a page renders from
     * what the server rendered from without that standing in for the held copy.
     * Only a 200 is held, and the default enforcing that is installed only while
     * no plugin of this rule's own defines `cacheWillUpdate`. */
    {
      matcher: /\/api\/tenant\/[^/]+\/locales\//,
      handler: new StaleWhileRevalidate({
        cacheName: tenantCacheName('locale-translations'),
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
        cacheName: tenantCacheName('display-images'),
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
        cacheName: tenantCacheName('pdf-reader'),
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

const channel = new BroadcastChannel(pushChannelName(scopeTenant));

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
        await fetch(withDeploymentBasePath(readPath), {method: 'POST'});
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
