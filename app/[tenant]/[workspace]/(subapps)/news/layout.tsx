// ---- CORE IMPORTS ----//
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getWorkspaceConfig} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';

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

  const {workspaceURL, tenant} = workspacePathname(params);

  const access = await ensureAuth({
    code: SUBAPP_CODES.news,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  /* Access is gated per-page; the layout renders chrome only when access
     resolves and otherwise passes children through untouched. */
  if (!access.ok) return <div className="mb-4 md:mb-10 h-full">{children}</div>;

  const {user, client} = access;

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  const allCategories = config
    ? await findCategories({
        showAllCategories: true,
        workspace: clone({...access.workspace, config}),
        client,
        user,
      }).then(clone)
    : [];

  return (
    <div className="mb-4 md:mb-10 h-full">
      {children}
      <MobileMenuCategory categories={allCategories} />
    </div>
  );
}
