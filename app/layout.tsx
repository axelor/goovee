/* The app resolves the tenant per request (path today, host later), so nothing
 * is statically rendered and frozen at build. This root layout is a
 * tenant-agnostic shell; the per-tenant theme and browser variables are applied
 * in app/[tenant]/layout.tsx. */
export const dynamic = 'force-dynamic';

import {
  Plus_Jakarta_Sans as FontSans,
  JetBrains_Mono as FontMono,
} from 'next/font/google';
import type {Metadata} from 'next';

// ---- CORE IMPORTS ---- //
import {LegacyServiceWorkerCleanup} from '@/pwa/legacy-sw-cleanup';
import {Toaster} from '@/ui/components/toaster';

// ---- LOCAL IMPORTS ---- //
import Locale from './locale';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* The root shell is tenant-agnostic: per-tenant theme and browser variables
   * (Environment) are injected by app/[tenant]/layout.tsx, and the tenant-less
   * auth pages set up their own (app/auth/layout.tsx + per-page Environment).
   * Translations are always requested from the origin the browser used, so they
   * need no tenant host here. */
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${fontSans.className}`}>
        <Locale>{children}</Locale>
        <Toaster />
        <LegacyServiceWorkerCleanup />
      </body>
    </html>
  );
}
