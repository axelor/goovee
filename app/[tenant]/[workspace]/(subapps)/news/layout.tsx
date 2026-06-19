import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ----//
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {manager} from '@/tenant';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import {findWorkspace} from '@/orm/workspace';
import {requireSubappAccess} from '@/lib/core/workspace/subapp-access';
import {t} from '@/locale/server';

// ---- LOCAL IMPORTS ---- //
import MobileMenuCategory from '@/subapps/news/mobile-menu-category';
import {findCategories} from '@/subapps/news/common/orm/news';

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

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  await requireSubappAccess({
    code: SUBAPP_CODES.news,
    url: workspaceURL,
    user,
    client,
    workspaceURI,
    tenantId,
  });

  const allCategories = await findCategories({
    showAllCategories: true,
    workspace,
    client,
    user,
  }).then(clone);

  return (
    <div className="mb-4 md:mb-10 h-full">
      {children}
      <MobileMenuCategory categories={allCategories} />
    </div>
  );
}
