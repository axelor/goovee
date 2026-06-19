import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {manager} from '@/tenant';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';
import {requireSubappAccess} from '@/lib/core/workspace/subapp-access';

// ---- LOCAL IMPORTS ---- //
import {MENU} from '@/app/[tenant]/[workspace]/(subapps)/forum/common/constants';
import MobileMenu from '@/subapps/forum/mobile-menu';

export default async function Layout(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
  }>;
  children: React.ReactNode;
}) {
  const params = await props.params;

  const {children} = props;

  const session = await getSession();

  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) return notFound();

  await requireSubappAccess({
    code: SUBAPP_CODES.forum,
    url: workspace.url,
    user: session?.user,
    client,
    workspaceURI,
    tenantId,
  });

  return (
    <>
      {children}
      <MobileMenu items={MENU} />
    </>
  );
}
