// ---- CORE IMPORTS ----//
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {getNewsConfig} from '@/subapps/news/common/orm/config';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import MobileMenuCategory from '@/subapps/news/mobile-menu-category';
import {NewsTopNav} from '@/subapps/news/common/ui/components';
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

  const access = await ensureAccess({
    code: SUBAPP_CODES.news,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  /* Access is gated per-page; the layout renders chrome only when access
     resolves and otherwise passes children through untouched. */
  if (!access.ok) return <div className="mb-4 md:mb-10 h-full">{children}</div>;

  const {user} = access;
  const {client} = access.tenant;

  const config = await getNewsConfig(access.workspace.config.id, client);
  const allCategories = config
    ? await findCategories({
        showAllCategories: true,
        workspace: access.workspace,
        client,
        user,
      }).then(clone)
    : [];

  const topCategories = allCategories
    .filter(c => !c?.parentCategory?.id)
    .map(c => ({id: String(c.id), name: c.name, slug: c.slug}));

  return (
    <div className="h-full flex flex-col">
      <NewsTopNav categories={topCategories} />
      <div className="flex-1 mb-4 md:mb-10">{children}</div>
      <MobileMenuCategory categories={allCategories} />
    </div>
  );
}
