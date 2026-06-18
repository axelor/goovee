// GOOVEE_PUBLIC_* vars are read from process.env at request time (not build time).
// force-dynamic ensures this layout is never statically rendered and cached at build,
// which would freeze env values and break runtime injection across environments.
export const dynamic = 'force-dynamic';

import {Poppins as FontSans} from 'next/font/google';
import {headers} from 'next/headers';
import type {Metadata} from 'next';

// ---- CORE IMPORTS ---- //
import {Environment, getPublicEnvironment} from '@/environment';
import {findTheme} from '@/orm/theme';
import {tenantConfigProvider} from '@/tenant/config-provider';
import {TENANT_HEADER} from '@/proxy';
import {Toaster} from '@/ui/components/toaster';

// ---- LOCAL IMPORTS ---- //
import Theme from './theme';
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
  manifest: withBasePath('/manifest'),
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenantId = (await headers()).get(TENANT_HEADER);
  const tenantConfig = tenantId
    ? await tenantConfigProvider.get(tenantId)
    : null;

  const [theme, env] = await Promise.all([
    findTheme(),
    getPublicEnvironment(tenantConfig),
  ]);

  return (
    <Theme theme={theme}>
      <html lang="en">
        <head>
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className={fontSans.className}>
          <Environment value={env}>
            <Locale>{children}</Locale>
            <Toaster />
          </Environment>
        </body>
      </html>
    </Theme>
  );
}
