import type {MetadataRoute} from 'next';

// ---- CORE IMPORTS ---- //
import {
  APP_DESCRIPTION,
  APP_TEMPLATE_TITLE,
  DEFAULT_APP_TEMPLATE_TITLE,
} from '@/constants';

export default function manifest(): MetadataRoute.Manifest {
  const manifestJSON = {
    name: DEFAULT_APP_TEMPLATE_TITLE,
    short_name: APP_TEMPLATE_TITLE,
    description: APP_DESCRIPTION,
    id: '/',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/pwa/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/pwa/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/pwa/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/pwa/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pwa/icons/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/pwa/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/pwa/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        src: '/pwa/screenshots/desktop-screenshot.png',
        sizes: '1194x602',
        type: 'image/png',
        form_factor: 'wide',
      },
      {
        src: '/pwa/screenshots/mobile-screenshot.png',
        type: 'image/png',
        sizes: '540x1107',
        form_factor: 'narrow',
      },
    ],
  };

  return manifestJSON as any;
}
