import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import {clone} from '@/utils';
import {getWorkspace, findSubappAccess} from '@/orm/workspace';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {getEventCategories} from '@/subapps/events/common/orm/event-category';
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
  const {workspaceURL} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.events,
    user: session?.user,
    url: workspaceURL,
    client,
  });

  if (!subapp) return notFound();

  const workspace = await getWorkspace(
    workspaceURL,
    session?.user,
    client,
  ).then(clone);

  if (!workspace) {
    return notFound();
  }

  const categories = await getEventCategories(workspace.url, user, client).then(
    clone,
  );

  return (
    <>
      {user && <EventNavbar user={user} />}
      {children}
      <MobileMenuCategory categories={categories} user={user} />
    </>
  );
}
