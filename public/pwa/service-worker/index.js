self.addEventListener('activate', event => {
  console.log('[Service Worker] Activated');
});

self.addEventListener('install', event => {
  console.log('[Service Worker] Installed');
});

self.addEventListener('fetch', event => {});

self.addEventListener('push', function (event) {});
