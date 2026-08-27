import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {findSubappAccess} from '@/orm/workspace';
import {manager} from '@/tenant';
import {workspacePathname} from '@/utils/workspace';
import {notFound} from 'next/navigation';
import type {ReactNode} from 'react';
import {MobileMenu} from './common/ui/components/nav/mobile-menu';
import {Navbar} from './common/ui/components/nav/navbar';

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
      <Navbar />
      {children}
      <MobileMenu
        icon={subapp?.icon ?? 'marketplace'}
        color={subapp?.color ?? undefined}
      />
    </div>
  );
}
