// ---- CORE IMPORTS ----//
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {workspacePathname} from '@/utils/workspace';
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';

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

  const {workspaceURL, tenant} = workspacePathname(params);

  const access = await ensureAuth({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  /* Access is gated per-page; the layout renders chrome only when access
     resolves and otherwise passes children through untouched. */
  if (!access.ok) return <>{children}</>;

  const {user} = access;
  const {client} = access.tenant;

  const categories = await findEventCategories({
    workspaceURL: access.workspace.url,
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
