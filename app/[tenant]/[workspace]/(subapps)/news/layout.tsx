import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ----//
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {findSubappAccess} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import {findWorkspace} from '@/orm/workspace';
import {t} from '@/locale/server';

// ---- LOCAL IMPORTS ---- //
import MobileMenuCategory from '@/subapps/news/mobile-menu-category';
import {findCategories} from '@/subapps/news/common/orm/news';

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

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.news,
    user,
    url: workspaceURL,
    tenantId: tenant,
  });

  if (!subapp) return notFound();

  const allCategories = await findCategories({
    showAllCategories: true,
    workspace,
    tenantId: tenant,
    user,
  }).then(clone);

  return (
    <div className="mb-4 md:mb-10 h-full">
      {children}
      <MobileMenuCategory categories={allCategories} />
    </div>
  );
}
