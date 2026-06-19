import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import {clone} from '@/utils';
import {requireSubappAccess} from '@/lib/core/workspace/subapp-access';
import {findWorkspace} from '@/orm/workspace';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {findEventCategories} from '@/subapps/events/common/orm/event-category';
import {
  EventNavbar,
  MobileMenuCategory,
} from '@/subapps/events/common/ui/components';

export default async function Layout(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
  }>;
  children: React.ReactNode;
}) {
  const params = await props.params;

  const {children} = props;

  const {tenant: tenantId} = params;

  const session = await getSession();
  const user = session?.user;
  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  await requireSubappAccess({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    user: session?.user,
    client,
    workspaceURI,
    tenantId,
  });

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const categories = await findEventCategories({
    workspaceURL: workspace.url,
    client,
    user,
  }).then(clone);

  return (
    <>
      {user && <EventNavbar user={user} />}
      {children}
      <MobileMenuCategory categories={categories} user={user} />
    </>
  );
}
