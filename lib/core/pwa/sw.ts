/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import {defaultCache} from '@serwist/next/worker';
import type {PrecacheEntry, SerwistGlobalConfig} from 'serwist';
import {Serwist} from 'serwist';

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
  runtimeCaching: defaultCache,
});

self.addEventListener('push', event => {
  const data = event.data?.json();
  if (!data) return;

  const title = data.title || 'Notification';
  const options: NotificationOptions & {renotify?: boolean} = {
    body: data.body,
    icon: data.icon ?? '/pwa/icons/icon-192x192.png',
    badge: data.badge ?? '/pwa/icons/icon-72x72.png',
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
      notificationId: data.notificationId,
      tenantId: data.tenantId,
      workspaceURL: data.workspaceURL,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));

  // Notify all tabs to refresh their notification count
  const channel = new BroadcastChannel('push-notifications');
  channel.postMessage({type: 'REFRESH_NOTIFICATIONS'});
  channel.close();
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const handleClick = async () => {
    const {url, notificationId, tenantId} = event.notification.data;
    const tag = event.notification.tag;
    if (tenantId) {
      try {
        const readUrl = tag
          ? `/api/tenant/${tenantId}/push/notifications/read/tag/${encodeURIComponent(tag)}`
          : `/api/tenant/${tenantId}/push/notifications/read/${notificationId}`;
        await fetch(readUrl, {method: 'POST'});
        // Notify all tabs to refresh since it's now read
        const channel = new BroadcastChannel('push-notifications');
        channel.postMessage({type: 'REFRESH_NOTIFICATIONS'});
        channel.close();
      } catch (err) {
        console.error('Failed to mark notification as read from SW:', err);
      }
    }

    const clientList = await self.clients.matchAll({type: 'window'});
    for (const client of clientList) {
      if (client.url === url && 'focus' in client) {
        return client.focus();
      }
    }
    if (self.clients.openWindow) {
      return self.clients.openWindow(url);
    }
  };

  event.waitUntil(handleClick());
});

serwist.addEventListeners();
