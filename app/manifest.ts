import type {MetadataRoute} from 'next';

// ---- CORE IMPORTS ---- //
import {
  APP_DESCRIPTION,
  APP_TEMPLATE_TITLE,
  DEFAULT_APP_TEMPLATE_TITLE,
} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: DEFAULT_APP_TEMPLATE_TITLE,
    short_name: APP_TEMPLATE_TITLE,
    description: APP_DESCRIPTION,
    id: withBasePath('/'),
    start_url: withBasePath('/'),
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: withBasePath('/pwa/icons/icon-72x72.png'),
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: withBasePath('/pwa/icons/icon-128x128.png'),
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: withBasePath('/pwa/icons/icon-144x144.png'),
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: withBasePath('/pwa/icons/icon-192x192.png'),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: withBasePath('/pwa/icons/icon-256x256.png'),
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: withBasePath('/pwa/icons/icon-384x384.png'),
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: withBasePath('/pwa/icons/icon-512x512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: withBasePath('/pwa/screenshots/desktop-screenshot.png'),
        sizes: '1194x602',
        type: 'image/png',
        form_factor: 'wide',
      },
      {
        src: withBasePath('/pwa/screenshots/mobile-screenshot.png'),
        type: 'image/png',
        sizes: '540x1107',
        form_factor: 'narrow',
      },
    ],
  };
}
