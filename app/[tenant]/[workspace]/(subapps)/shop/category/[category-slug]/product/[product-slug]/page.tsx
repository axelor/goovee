import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';
import type {Metadata} from 'next';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {clone, htmlToNormalString} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {shouldHidePricesAndPurchase} from '@/orm/product';

// ---- LOCAL IMPORTS ---- //
import type {ComputedProduct} from '@/types';
import {
  ShopProductDetail,
  type ShopCategory,
} from '@/subapps/shop/common/ui/components';
import {
  findProductBySlug,
  findProducts,
} from '@/subapps/shop/common/orm/product';
import {getShopConfig} from '@/subapps/shop/common/orm/config';
import {findCategories} from '@/subapps/shop/common/orm/categories';
import {buildProductDetailLabels} from '@/subapps/shop/common/utils/product-detail-labels';

const CATALOG_LIMIT = 500;
const RELATED_LIMIT = 4;

export async function generateMetadata(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    'category-slug': string;
    'product-slug': string;
  }>;
}): Promise<Metadata | null> {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const productSlug = params['product-slug'];

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) return null;

  const {user} = access;
  const {client, config} = access.tenant;

  const workspaceConfig = await getShopConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return null;

  const computed = await findProductBySlug({
    slug: productSlug,
    workspace: access.workspace,
    workspaceConfig,
    user,
    client,
    config,
  });
  if (!computed?.product) return null;

  return {
    title: computed.product?.name,
    description: htmlToNormalString(computed.product?.description ?? ''),
  };
}

async function Detail({
  params,
}: {
  params: {
    tenant: string;
    workspace: string;
    'category-slug': string;
    'product-slug': string;
  };
}) {
  const productSlug = params['product-slug'];
  const categorySlug = params['category-slug'];
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  if (!(productSlug && categorySlug)) {
    return redirect(`${workspaceURI}/shop`);
  }

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

  const allCategoriesRaw = await findCategories({
    workspace: access.workspace,
    client,
    user,
  }).then(clone);
  const allCategories = (allCategoriesRaw as ShopCategory[]) ?? [];
  // Portal products are exposed through this workspace's portal categories;
  // scope every lookup so non-portal products can't be reached (incl. by URL).
  const portalCategoryIds = allCategories
    .map(c => c?.id)
    .filter((id): id is string | number => id != null);

  const [computed, allProductsRes, labels, hidePriceAndPurchase] =
    await Promise.all([
      findProductBySlug({
        slug: productSlug,
        workspace: access.workspace,
        workspaceConfig,
        user,
        client,
        config,
        categoryids: portalCategoryIds,
      }),
      portalCategoryIds.length
        ? findProducts({
            workspace: access.workspace,
            workspaceConfig,
            client,
            user,
            config,
            page: 1,
            limit: CATALOG_LIMIT,
            categoryids: portalCategoryIds,
          }).then(clone)
        : Promise.resolve([]),
      buildProductDetailLabels(),
      shouldHidePricesAndPurchase({user, config: workspaceConfig, client}),
    ]);

  if (!computed?.product) return redirect(`${workspaceURI}/shop`);

  const allProducts: ComputedProduct[] = Array.isArray(allProductsRes)
    ? (allProductsRes as ComputedProduct[])
    : ((allProductsRes as {products?: ComputedProduct[]})?.products ?? []);

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

  const categories: ShopCategory[] = allCategories
    .filter(c => categoriesWithProducts.has(String(c.id)))
    .map(c => ({id: c.id, name: c.name, slug: c.slug}));

  const currentPortalIds: string[] = (computed.product?.portalCategorySet ?? [])
    .map(c => String(c?.id ?? ''))
    .filter(Boolean);
  const related = currentPortalIds.length
    ? allProducts
        .filter(p => {
          if (p?.product?.id === computed.product?.id) return false;
          const portal = p?.product?.portalCategorySet ?? [];
          return portal.some(c => currentPortalIds.includes(String(c?.id)));
        })
        .slice(0, RELATED_LIMIT)
    : [];

  return (
    <ShopProductDetail
      product={clone(computed)}
      categories={categories}
      countsByCat={countsByCat}
      totalCount={allProducts.length}
      relatedProducts={clone(related)}
      labels={labels}
      hidePriceAndPurchase={hidePriceAndPurchase}
      displayPrices={Boolean(workspaceConfig.displayPrices)}
    />
  );
}

function DetailSkeleton() {
  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-ink-25">
      <div className="w-[260px] shrink-0 bg-white border-r border-ink-100 px-[18px] py-5" />
      <div className="flex-1 px-8 py-6">
        <div className="h-4 w-64 bg-ink-100 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[380px] rounded-[16px] bg-ink-100 animate-pulse" />
          <div className="flex flex-col gap-4">
            <div className="h-8 w-3/4 bg-ink-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-ink-100 rounded animate-pulse" />
            <div className="h-40 bg-ink-100 rounded-[14px] animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 mt-8 mb-5">
          <div className="h-9 w-28 bg-ink-100 rounded animate-pulse" />
          <div className="h-9 w-28 bg-ink-100 rounded animate-pulse" />
        </div>
        <div className="h-32 max-w-[760px] rounded-[14px] bg-ink-100 animate-pulse" />
      </div>
    </div>
  );
}

export default async function Page(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    'product-slug': string;
    'category-slug': string;
  }>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Detail params={params} />
    </Suspense>
  );
}
