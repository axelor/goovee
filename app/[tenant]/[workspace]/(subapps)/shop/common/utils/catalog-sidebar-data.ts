import {clone} from '@/utils';
import type {User} from '@/types';
import type {Workspace} from '@/orm/workspace';
import type {Cloned} from '@/types/util';
import type {Client} from '@/goovee/.generated/client';

import {findProducts} from '@/subapps/shop/common/orm/product';
import {findCategories} from '@/subapps/shop/common/orm/categories';
import type {ShopCategory} from '@/subapps/shop/common/ui/components';

const CATALOG_LIMIT = 500;

export async function loadCatalogSidebarData({
  workspace,
  client,
  user,
  config,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  config?: any;
}): Promise<{
  categories: ShopCategory[];
  countsByCat: Record<string, number>;
  totalCount: number;
}> {
  const [allCategoriesRaw, allProductsRes] = await Promise.all([
    findCategories({workspace, client, user}).then(clone),
    findProducts({
      workspace,
      client,
      user,
      config,
      page: 1,
      limit: CATALOG_LIMIT,
    }).then(clone),
  ]);

  const allProducts: any[] = Array.isArray(allProductsRes)
    ? allProductsRes
    : ((allProductsRes as any)?.products ?? []);

  // Mirror the ORM where clause: products are exposed via portalCategorySet,
  // not productCategory. Categories with no products in portalCategorySet are
  // filtered out so they don't appear empty in the sidebar.
  const categoriesWithProducts = new Set<string>();
  const countsByCat: Record<string, number> = {};
  for (const p of allProducts) {
    const portal = p?.product?.portalCategorySet ?? [];
    const seen = new Set<string>();
    for (const c of portal) {
      const id = String(c?.id ?? '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      categoriesWithProducts.add(id);
      countsByCat[id] = (countsByCat[id] ?? 0) + 1;
    }
  }

  const allCategories = (allCategoriesRaw as any[]) ?? [];
  const categories: ShopCategory[] = allCategories
    .filter(c => categoriesWithProducts.has(String(c.id)))
    .map(c => ({id: c.id, name: c.name, slug: c.slug}));

  return {categories, countsByCat, totalCount: allProducts.length};
}
