'use client';

import dynamic from 'next/dynamic';

/*
 * The reader is fetched when a document is opened and never rendered on the
 * server.
 *
 * Both parts belong to the reader rather than to whoever shows a document, so
 * they are settled here: it is by a wide margin the largest thing any page that
 * uses it loads, and most visits to those pages open no document at all; and it
 * reaches for browser drawing interfaces as it loads, which do not exist where
 * pages are rendered, so rendering it there fails outright.
 */
export const PDFReader = dynamic(
  () => import('./pdf-reader').then(module => module.PDFReader),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-sm text-ink-500">&nbsp;</div>
    ),
  },
);
