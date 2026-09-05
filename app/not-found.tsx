'use client';

import {MdHome} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {ErrorScreen} from '@/ui/components/error-screen';

/**
 * The deployment's own not-found, for an address that resolves no tenant at
 * all: a first segment naming nothing the document holds, an address the
 * deployment reserves for itself, a host it does not answer on — and every
 * address matching no route, whatever it names, since an unmatched address
 * always resolves against this boundary rather than a nested one.
 *
 * Written in English rather than translated: it renders above the tenant
 * segment, where no tenant's translations are loaded, and inventing a locale
 * for a page that resolved no tenant would name one arbitrarily.
 *
 * "Home" is the deployment's entry, which resolves a tenant of its own — the
 * only destination that can be offered from here, since nothing about the
 * address said which tenant was wanted.
 */
export default function NotFound() {
  return (
    <ErrorScreen
      standalone
      watermark="404"
      badge="Error 404"
      heading="This page seems to be unreachable"
      description="The address leads nowhere on this portal. It may be mistyped, or the link may be outdated."
      action={{
        href: '/',
        label: 'Return home',
        icon: <MdHome className="size-[18px]" />,
      }}
    />
  );
}
