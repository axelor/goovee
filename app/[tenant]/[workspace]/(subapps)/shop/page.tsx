import {Suspense} from 'react';
import type {Cloned} from '@/types/util';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {DEFAULT_LIMIT, SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import type {TenantConfig} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import type {User} from '@/types';
import type {Workspace} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import type {ComputedProduct} from '@/types';
import {
  DEFAULT_SORT_OPTION,
  SORT_BY_OPTIONS,
} from '@/subapps/shop/common/constants';
import {
  countProductsByPortalCategory,
  findProducts,
} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/orm/product';
import {shouldHidePricesAndPurchase} from '@/orm/product';
import {getShopConfig, type ShopConfig} from '@/subapps/shop/common/orm/config';
import {findCategories} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/orm/categories';
import {
  OrderAlert,
  ShopCatalog,
  type ShopCategory,
  type ShopLabels,
  type ShopSortOption,
} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/ui/components';

/* One screenful of the three-column grid. */
const PRODUCTS_PER_PAGE = DEFAULT_LIMIT;

/* A category and everything under it, walked down the `items` the query nested.
   Rolled-up counts and the category filter both need the same set. */
function collectSubtreeIds(
  categories: ShopCategory[],
  rootId: string,
): string[] {
  const ids = new Set<string>();
  const stack = categories.filter(category => String(category.id) === rootId);

  while (stack.length) {
    const current = stack.pop()!;
    const id = String(current.id);
    if (ids.has(id)) continue;
    ids.add(id);
    for (const child of current.items ?? []) stack.push(child);
  }

  return [...ids];
}

/* The workspace decides which of the orderings it offers. Ordering is left to
 * the query so it runs on the stored values rather than on formatted prices. */
async function buildSortOptions(
  workspaceConfig: ShopConfig | Cloned<ShopConfig>,
): Promise<ShopSortOption[]> {
  const enabled = SORT_BY_OPTIONS.filter(option =>
    Boolean(workspaceConfig[option.value]),
  );

  return Promise.all(
    enabled.map(async option => ({
      value: option.value,
      label: await t(option.label),
    })),
  );
}

async function Catalog({
  workspace,
  client,
  user,
  config,
  workspaceConfig,
  sort,
  category,
  search,
  inStockOnly,
  page,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user: User | undefined;
  config: TenantConfig;
  workspaceConfig: ShopConfig | Cloned<ShopConfig>;
  sort?: string;
  category?: string;
  search?: string;
  inStockOnly: boolean;
  page: number;
}) {
  const [categoriesRes, labels, hidePriceAndPurchase, sortOptions] =
    await Promise.all([
      findCategories(workspace.id, user, client).then(clone),
      buildLabels(),
      shouldHidePricesAndPurchase({user, config: workspaceConfig, client}),
      buildSortOptions(workspaceConfig),
    ]);

  const defaultSort =
    sortOptions.find(option => option.value === DEFAULT_SORT_OPTION)?.value ??
    sortOptions[0]?.value;

  const activeSort =
    sortOptions.find(option => option.value === sort)?.value ?? defaultSort;

  const allCategories = (categoriesRes as ShopCategory[]) ?? [];

  // Restore the pre-redesign scoping: the portal only exposes products that
  // belong to one of this workspace's portal categories (portalCategorySet).
  // Without this scope, every non-portal product (e.g. purchase-only packaging
  // such as "Carton Galia A05") leaks into the catalog.
  const portalCategoryIds = allCategories
    .map(c => c?.id)
    .filter((id): id is string | number => id != null);

  /* Selecting a category means its whole subtree, so the query is given every
     id below the chosen one — otherwise a parent looks empty when its products
     live in its children. With nothing chosen the scope is the workspace. */
  const selectedCategoryIds = category
    ? collectSubtreeIds(allCategories, category)
    : portalCategoryIds;

  const [productsRes, categoryCounts] = await Promise.all([
    selectedCategoryIds.length
      ? findProducts({
          workspace,
          client,
          user,
          config,
          workspaceConfig,
          page,
          limit: PRODUCTS_PER_PAGE,
          sort: activeSort,
          search,
          inStockOnly,
          categoryids: selectedCategoryIds,
        }).then(clone)
      : null,
    countProductsByPortalCategory({
      workspace,
      workspaceConfig,
      client,
      user,
      categoryids: portalCategoryIds,
    }),
  ]);

  /* The web-service pricing path can drop a product it cannot price, so the
     rows it returns are nullable even though it filters them out. */
  const products: ComputedProduct[] = (productsRes?.products ?? []).filter(
    (product): product is ComputedProduct => product != null,
  );
  const pageInfo = productsRes?.pageInfo;
  const totalProducts = Number(pageInfo?.count ?? 0);
  const totalPages = Number(pageInfo?.pages ?? 1) || 1;

  /* Handed over as the query built it — each category already carries its
     children in `items`, and its parent link. The catalogue needs both: the
     tree to list the categories, and the descendants of the selected one so
     that picking a parent includes products living only in its children. */
  return (
    <ShopCatalog
      categories={allCategories}
      products={products}
      labels={labels}
      sortOptions={sortOptions}
      activeSort={activeSort}
      defaultSort={defaultSort}
      hidePriceAndPurchase={hidePriceAndPurchase}
      displayPrices={Boolean(workspaceConfig.displayPrices)}
      categoryCounts={categoryCounts.counts}
      catalogueTotal={categoryCounts.total}
      totalProducts={totalProducts}
      page={page}
      totalPages={totalPages}
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
      <div className="hidden lg:block w-[260px] shrink-0 bg-white border-r border-ink-100 px-[18px] py-5" />
      <div className="flex-1 px-8 py-7">
        <div className="h-8 w-64 bg-ink-100 rounded mb-2 animate-pulse" />
        <div className="h-4 w-32 bg-ink-100 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Array.from({length: PRODUCTS_PER_PAGE}, (_, index) => index).map(
            index => (
              <div
                key={index}
                className="h-[260px] bg-white rounded-xl border border-ink-100 animate-pulse"
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{[key: string]: string | string[] | undefined}>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const readParam = (key: string) =>
    typeof searchParams[key] === 'string' ? searchParams[key] : undefined;

  const sort = readParam('sort');
  const category = readParam('cat');
  const search = readParam('q')?.trim() || undefined;
  const inStockOnly = readParam('stock') === '1';
  /* A whole, sane page number: a fractional or enormous value would otherwise
     reach the query as an offset and either return the wrong slice or exceed
     what the database can take. */
  const requestedPage = Math.floor(Number(readParam('page')));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 1
      ? requestedPage
      : 1;

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
          sort={sort}
          category={category}
          search={search}
          inStockOnly={inStockOnly}
          page={page}
        />
      </Suspense>
      <OrderAlert />
    </>
  );
}
