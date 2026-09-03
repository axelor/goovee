import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {findSubappAccess} from '@/orm/workspace';
import {manager} from '@/tenant';
import {currentWorkspace} from '@/lib/core/url/current';
import {notFound} from 'next/navigation';
import type {ReactNode} from 'react';
import {MobileMenu} from './common/ui/components/nav/mobile-menu';
import {Navbar} from './common/ui/components/nav/navbar';

export default async function Layout({
  children,
}: {
  params: Promise<{tenant: string; workspace: string}>;
  children: ReactNode;
}) {
  /* Not a gate — each page runs its own. This only reads the app's icon and
   * colour for the mobile menu, so it names the workspace the request arrived
   * at rather than paying for an access check to reach a presentational
   * lookup. */
  const scope = await currentWorkspace();
  if (!scope) return notFound();

  const tenant = await manager.getTenant(scope.tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const session = await getSession();
  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.marketplace,
    user: session?.user,
    url: scope.key(),
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
