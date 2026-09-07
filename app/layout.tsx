/* The app resolves the tenant per request, from the path or the host, so
 * nothing is statically rendered and frozen at build.
 *
 * This root layout is a tenant-agnostic shell: the per-tenant theme, browser
 * variables, authentication endpoint and translations are all mounted in
 * app/[tenant]/layout.tsx, where a tenant is known and no client navigation can
 * carry a page out from under the shell that chose them. */
export const dynamic = 'force-dynamic';

import {
  Plus_Jakarta_Sans as FontSans,
  JetBrains_Mono as FontMono,
} from 'next/font/google';
import type {Metadata} from 'next';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {LegacyServiceWorkerCleanup} from '@/pwa/legacy-sw-cleanup';
import {addressedHost} from '@/lib/core/tenant/routing';
import {getRoutingIndex} from '@/tenant/config';
import {Toaster} from '@/ui/components/toaster';

// ---- LOCAL IMPORTS ---- //
import {
  APP_DESCRIPTION,
  APP_TITLE,
  APP_TITLE_TEMPLATE,
  DEFAULT_APP_TITLE,
} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';
import './globals.css';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';

const fontSans = FontSans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal'],
  variable: '--font-sans',
  display: 'swap',
});

const fontMono = FontMono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  applicationName: DEFAULT_APP_TITLE,
  title: {
    template: APP_TITLE_TEMPLATE,
    default: DEFAULT_APP_TITLE,
  },
  description: APP_DESCRIPTION,
  manifest: withBasePath('/manifest.webmanifest'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: DEFAULT_APP_TITLE,
    title: {
      template: APP_TITLE_TEMPLATE,
      default: DEFAULT_APP_TITLE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: {
      template: APP_TITLE_TEMPLATE,
      default: DEFAULT_APP_TITLE,
    },
    description: APP_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const host = addressedHost(requestHeaders);

  /* What gates the upgrade cleanup below. That cleanup unregisters a service
   * worker scoped to the root of the origin, which is exactly where a tenant
   * reached by host registers its own — so on such an origin it would
   * unregister that tenant's worker on every page load. Nothing is left behind
   * by leaving it out: a registration is keyed by its scope, so the tenant's own
   * registration at that scope replaces whatever an earlier build left there
   * rather than sitting alongside it. */
  const servesHostRoutedTenant = Boolean(
    host && getRoutingIndex().tenantByHost.has(host),
  );

  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${fontSans.className}`}>
        {children}
        <Toaster />
        {!servesHostRoutedTenant && <LegacyServiceWorkerCleanup />}
      </body>
    </html>
  );
}
