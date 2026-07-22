// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {workspacePathname} from '@/utils/workspace';
import {clone} from '@/utils';
import {t} from '@/locale/server';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {fetchExplorerCategories} from '@/subapps/resources/common/orm/dms';
import {searchDocuments} from '@/subapps/resources/search/action';
import {
  DocsSidebar,
  type DocsSidebarCategory,
} from '@/subapps/resources/common/ui/components';
import {FolderLogoIcon} from '@/subapps/resources/common/ui/components/folder-logo-icon';

export default async function Layout({
  params: paramsPromise,
  children,
}: {
  params: Promise<{tenant: string; workspace: string}>;
  children: React.ReactNode;
}) {
  const params = await paramsPromise;

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  // The authoritative access gate lives on each page; here we only resolve the
  // scoped client/user to populate the sidebar. When access is denied we render
  // the shell with an empty tree and let the page handle the redirect/404.
  const access = await ensureAccess({
    code: SUBAPP_CODES.resources,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  const [categoriesTree, searchPlaceholder, homeLabel, categoriesLabel] =
    await Promise.all([
      access.ok
        ? fetchExplorerCategories({
            workspaceURL,
            client: access.tenant.client,
            user: access.user,
          }).then(clone)
        : [],
      t('Search…'),
      t('app-home'),
      t('Categories'),
    ]);

  // Build the visible tree roots: entries whose parent is null OR whose parent
  // is not part of the fetched set (treat orphans as visible roots, since the
  // parent may live outside the current workspace's DMS scope).
  const allCats = categoriesTree ?? [];
  const allIds = new Set(allCats.map(c => c.id));
  const topLevel = allCats.filter(
    c => !c.parent || !c.parent.id || !allIds.has(c.parent.id),
  ) as DocsSidebarCategory[];

  // The logoSelect → react-icons map lives in a server-only module, so the
  // sidebar (a client component) receives each node's icon pre-rendered.
  const withIcons = (
    nodes: DocsSidebarCategory[],
    depth = 0,
  ): DocsSidebarCategory[] =>
    nodes.map(node => ({
      ...node,
      icon: (
        <FolderLogoIcon
          logoSelect={node.logoSelect}
          colorSelect={node.colorSelect}
          size={depth === 0 ? 22 : 18}
        />
      ),
      children: node.children && withIcons(node.children, depth + 1),
    }));
  const categories = withIcons(topLevel);

  return (
    <div className="flex flex-1 min-h-0 bg-ink-25">
      <DocsSidebar
        categories={categories}
        workspaceURI={workspaceURI}
        workspaceURL={workspaceURL}
        searchPlaceholder={searchPlaceholder}
        homeLabel={homeLabel}
        categoriesLabel={categoriesLabel}
        searchAction={searchDocuments}
      />
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
