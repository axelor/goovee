'use client';

import {MdHome} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {ErrorScreen} from '@/ui/components/error-screen';
import {useTenantScope} from '@/lib/core/url/tenant-context';

/**
 * The tenant's own not-found, for an address that named this tenant and got no
 * further: a workspace it does not hold, or one whose shell refused to open —
 * a workspace layout answering not-found is caught here rather than by the
 * workspace's own boundary, since a layout's answer is caught by the boundary
 * above it.
 *
 * Without this the same addresses fall through to the deployment's not-found,
 * which is rendered above the tenant segment and can only offer the entry
 * address as a way back. Here the tenant is known, so the way back is its own
 * entry, which lands the visitor on a workspace they can actually open.
 *
 * Written in English for the reason the deployment's is: an address that
 * resolved no workspace has no locale of its own to be read in.
 */
export default function TenantNotFound() {
  const scope = useTenantScope();

  return (
    <ErrorScreen
      standalone
      watermark="404"
      badge="Error 404"
      heading="This workspace seems to be unreachable"
      description="It may have been renamed or closed, or it may not be one this account can open."
      action={{
        href: scope.forRouter('/'),
        label: 'Go to your workspace',
        icon: <MdHome className="size-[18px]" />,
      }}
    />
  );
}
