import {Poppins as FontSans} from 'next/font/google';
import type {Metadata} from 'next';

// ---- CORE IMPORTS ---- //
import {Environment} from '@/environment';
import {findTheme} from '@/orm/theme';
import {Toaster} from '@/ui/components/toaster';

// ---- LOCAL IMPORTS ---- //
import Theme from './theme';
import Locale from './locale';
import Session from './session';
import {
  APP_DESCRIPTION,
  APP_TEMPLATE_TITLE,
  DEFAULT_APP_TEMPLATE_TITLE,
} from '@/constants';
import ServiceWorker from './service-worker';
import './globals.css';

const fontSans = FontSans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    template: APP_TEMPLATE_TITLE,
    default: DEFAULT_APP_TEMPLATE_TITLE,
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest',
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
  const theme = await findTheme();

  return (
    <Theme theme={theme}>
      <html lang="en">
        <head>
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className={fontSans.className}>
          <Environment>
            <Session>
              <Locale>
                <ServiceWorker />
                {children}
              </Locale>
            </Session>
            <Toaster />
          </Environment>
        </body>
      </html>
    </Theme>
  );
}
