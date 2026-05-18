import type {ReactNode} from 'react';
import {notFound} from 'next/navigation';

import {SUBAPP_CODES} from '@/constants';
import {getSession} from '@/auth';
import {manager} from '@/tenant';
import {findSubappAccess} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';

import {MarketplaceNavbar} from './common/ui/components/marketplace-navbar';
import {MarketplaceMobileMenu} from './common/ui/components/marketplace-mobile-menu';

export default async function Layout({
  children,
  params,
}: {
  params: Promise<{tenant: string; workspace: string}>;
  children: ReactNode;
}) {
  const resolvedParams = await params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(resolvedParams);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const session = await getSession();
  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.marketplace,
    user: session?.user,
    url: workspaceURL,
    client,
  });

  return (
    <div className="mb-[72px] lg:mb-0">
      <MarketplaceNavbar />
      {children}
      <MarketplaceMobileMenu
        icon={subapp?.icon ?? 'marketplace'}
        color={subapp?.color ?? undefined}
      />
    </div>
  );
}
