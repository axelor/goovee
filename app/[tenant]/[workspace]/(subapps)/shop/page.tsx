import {Suspense} from 'react';
import type {Cloned} from '@/types/util';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import type {TenantConfig} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import type {User} from '@/types';
import type {Workspace} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import type {ComputedProduct} from '@/types';
import {findProducts} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/orm/product';
import {shouldHidePricesAndPurchase} from '@/orm/product';
import {getShopConfig, type ShopConfig} from '@/subapps/shop/common/orm/config';
import {findCategories} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/orm/categories';
import {
  OrderAlert,
  ShopCatalog,
  type ShopCategory,
  type ShopLabels,
} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/ui/components';

const CATALOG_LIMIT = 500;

async function Catalog({
  workspace,
  client,
  user,
  config,
  workspaceConfig,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user: User | undefined;
  config: TenantConfig;
  workspaceConfig: ShopConfig | Cloned<ShopConfig>;
}) {
  const [categoriesRes, labels, hidePriceAndPurchase] = await Promise.all([
    findCategories({workspace, client, user}).then(clone),
    buildLabels(),
    shouldHidePricesAndPurchase({user, config: workspaceConfig, client}),
  ]);

  const allCategories = (categoriesRes as ShopCategory[]) ?? [];

  // Restore the pre-redesign scoping: the portal only exposes products that
  // belong to one of this workspace's portal categories (portalCategorySet).
  // Without this scope, every non-portal product (e.g. purchase-only packaging
  // such as "Carton Galia A05") leaks into the catalog.
  const portalCategoryIds = allCategories
    .map(c => c?.id)
    .filter((id): id is string | number => id != null);

  const productsRes = portalCategoryIds.length
    ? await findProducts({
        workspace,
        client,
        user,
        config,
        workspaceConfig,
        page: 1,
        limit: CATALOG_LIMIT,
        categoryids: portalCategoryIds,
      }).then(clone)
    : [];

  const products: ComputedProduct[] = Array.isArray(productsRes)
    ? (productsRes as ComputedProduct[])
    : ((productsRes as {products?: ComputedProduct[]})?.products ?? []);
  // Keep only leaf categories that actually contain products in the portal —
  // the ORM filter clauses pivot through portalCategorySet (many-to-many),
  // not productCategory (the product's primary business category). Using
  // productCategory here would surface categories that look populated but
  // resolve to 0 products when clicked.
  const categoriesWithProducts = new Set<string>();
  for (const p of products) {
    const portal = p?.product?.portalCategorySet ?? [];
    for (const c of portal) {
      if (c?.id) categoriesWithProducts.add(String(c.id));
    }
  }
  const categories: ShopCategory[] = allCategories
    .filter(c => categoriesWithProducts.has(String(c.id)))
    .map(c => ({id: c.id, name: c.name, slug: c.slug}));

  return (
    <ShopCatalog
      categories={categories}
      products={products}
      labels={labels}
      hidePriceAndPurchase={hidePriceAndPurchase}
      displayPrices={Boolean(workspaceConfig.displayPrices)}
    />
  );
}

async function buildLabels(): Promise<ShopLabels> {
  const [
    categoriesTitle,
    allProducts,
    availabilityTitle,
    inStockOnly,
    defaultPageTitle,
    productsLabel,
    productLabel,
    searchPlaceholder,
    sortRelevance,
    sortPriceAsc,
    sortPriceDesc,
    sortName,
    inStockBadge,
    outOfStockBadge,
    addToCartLabel,
    addedLabel,
    emptyTitle,
    emptySubtitle,
  ] = await Promise.all([
    t('Categories'),
    t('All products'),
    t('Availability'),
    t('In stock only'),
    t('Catalogue'),
    t('products'),
    t('product'),
    t('Search…'),
    t('Relevance'),
    t('Price ascending'),
    t('Price descending'),
    t('Name A-Z'),
    t('In stock'),
    t('Out of stock'),
    t('Add to cart'),
    t('Added'),
    t('No product matches your filters'),
    t('Try adjusting the category, search or availability filters.'),
  ]);

  return {
    categoriesTitle,
    allProducts,
    availabilityTitle,
    inStockOnly,
    defaultPageTitle,
    productsLabel,
    productLabel,
    searchPlaceholder,
    sortRelevance,
    sortPriceAsc,
    sortPriceDesc,
    sortName,
    inStockBadge,
    outOfStockBadge,
    addToCartLabel,
    addedLabel,
    emptyTitle,
    emptySubtitle,
  };
}

function CatalogSkeleton() {
  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-ink-25">
      <div className="w-[260px] shrink-0 bg-white border-r border-ink-100 px-[18px] py-5" />
      <div className="flex-1 px-8 py-7">
        <div className="h-8 w-64 bg-ink-100 rounded mb-2 animate-pulse" />
        <div className="h-4 w-32 bg-ink-100 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-[260px] bg-white rounded-xl border border-ink-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  if (!access.ok) {
    if (
      access.reason === 'workspace-not-found' ||
      access.reason === 'app-not-installed'
    ) {
      notFound();
    }
    if (!access.user) {
      redirect(
        getLoginURL({
          callbackurl: await getCurrentPath(),
          workspaceURI,
          [SEARCH_PARAMS.TENANT_ID]: tenant,
        }),
      );
    }
    unauthorized();
  }

  const {user} = access;
  const {client, config} = access.tenant;

  const workspaceConfig = await getShopConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return notFound();

  return (
    <>
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog
          workspace={access.workspace}
          client={client}
          user={user}
          config={config}
          workspaceConfig={workspaceConfig}
        />
      </Suspense>
      <OrderAlert />
    </>
  );
}
