import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import {clone} from '@/utils';
import {findWorkspace, findSubappAccess} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import {findEventCategories} from '@/subapps/events/common/orm/event-category';
import {
  EventNavbar,
  MobileMenuCategory,
} from '@/subapps/events/common/ui/components';

export default async function Layout(
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
    }>;
    children: React.ReactNode;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const {tenant} = params;

  const session = await getSession();
  const user = session?.user;
  const {workspaceURL} = workspacePathname(params);

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.events,
    user: session?.user,
    url: workspaceURL,
    tenantId: tenant,
  });

  if (!subapp) return notFound();

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const categories = await findEventCategories({
    workspace,
    tenantId: tenant,
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
