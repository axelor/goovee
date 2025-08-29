'use client';

import {useEffect} from 'react';

export function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/pwa/service-worker/index.js')
          .then(reg => console.log('Service worker registered:', reg))
          .catch(err =>
            console.error('Service Worker registration failed:', err),
          );
      });
    }
  }, []);

  return null;
}

export default ServiceWorker;
