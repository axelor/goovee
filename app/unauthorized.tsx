'use client';

import {MdHome} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {ErrorScreen} from '@/ui/components/error-screen';

/**
 * The deployment's own unauthorized screen, for a refusal raised above the
 * tenant segment. A refusal inside a workspace is answered by that workspace's
 * own screen instead, which keeps the visitor in its shell.
 *
 * Written in English rather than translated, for the reason the deployment's
 * not-found is: it renders above the tenant, where no tenant's translations are
 * loaded.
 */
export default function Unauthorized() {
  return (
    <ErrorScreen
      standalone
      watermark="401"
      badge="Error 401"
      heading="This page is not open to you"
      description="The address exists, but this account cannot open it. Signing in as someone else may help."
      action={{
        href: '/',
        label: 'Return home',
        icon: <MdHome className="size-[18px]" />,
      }}
    />
  );
}
