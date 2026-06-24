/* The app resolves the tenant per request (path today, host later), so nothing
 * is statically rendered and frozen at build. This root layout is a
 * tenant-agnostic shell; the per-tenant theme and browser variables are applied
 * in app/[tenant]/layout.tsx. */
export const dynamic = 'force-dynamic';

import {Poppins as FontSans} from 'next/font/google';
import type {Metadata} from 'next';

// ---- CORE IMPORTS ---- //
import {LegacyServiceWorkerCleanup} from '@/pwa/legacy-sw-cleanup';
import {Toaster} from '@/ui/components/toaster';

// ---- LOCAL IMPORTS ---- //
import Locale from './locale';
import {
  APP_DESCRIPTION,
  APP_TEMPLATE_TITLE,
  DEFAULT_APP_TEMPLATE_TITLE,
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
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  applicationName: DEFAULT_APP_TEMPLATE_TITLE,
  title: {
    template: APP_TEMPLATE_TITLE,
    default: DEFAULT_APP_TEMPLATE_TITLE,
  },
  description: APP_DESCRIPTION,
  manifest: withBasePath('/manifest.webmanifest'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_TEMPLATE_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: DEFAULT_APP_TEMPLATE_TITLE,
    title: {
      template: APP_TEMPLATE_TITLE,
      default: DEFAULT_APP_TEMPLATE_TITLE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: {
      template: APP_TEMPLATE_TITLE,
      default: DEFAULT_APP_TEMPLATE_TITLE,
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
   * Locale degrades to a same-origin relative locale fetch when no host is set. */
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={fontSans.className}>
        <Locale>{children}</Locale>
        <Toaster />
        <LegacyServiceWorkerCleanup />
      </body>
    </html>
  );
}
