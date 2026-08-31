import type {MetadataRoute} from 'next';

// ---- CORE IMPORTS ---- //
import {APP_DESCRIPTION, APP_TITLE, DEFAULT_APP_TITLE} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';

type ManifestAddresses = {
  /* Identity of the installed app, resolved against the origin. Distinct per
   * tenant, so installing a second tenant adds an app rather than replacing the
   * first one. Never navigated to. */
  id: string;
  /* What the icon launches, so it has to be an address that resolves. */
  startUrl: string;
  /* The area that stays inside the app window — anything outside it opens in a
   * browser tab with a URL bar. Bounded above by the scope of the service worker
   * registered on the pages the app is installed from: a browser installs an app
   * only where that registration encloses both this and `startUrl`, and scopes
   * match by path prefix. */
  scope: string;
};

/* Builds the web app manifest for one installed app. All three addresses are
 * already base-path-prefixed. Icons and screenshots are origin-level assets
 * shared by every tenant. */
export function buildManifest({
  id,
  startUrl,
  scope,
}: ManifestAddresses): MetadataRoute.Manifest {
  return {
    id,
    name: DEFAULT_APP_TITLE,
    short_name: APP_TITLE,
    description: APP_DESCRIPTION,
    start_url: startUrl,
    scope,
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
        sizes: '540x1107',
        type: 'image/png',
        form_factor: 'narrow',
      },
    ],
  };
}
