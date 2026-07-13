import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- ///
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {DEFAULT_LIMIT, SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import type {Category} from '@/types';
import {shouldHidePricesAndPurchase} from '@/orm/product';

// ---- LOCAL IMPORTS ---- //
import {
  ProductList,
  ProductListSkeleton,
} from '@/subapps/shop/common/ui/components';
import {findProducts} from '@/subapps/shop/common/orm/product';
import {getShopConfig} from '@/subapps/shop/common/orm/config';
import {findCategories} from '@/subapps/shop/common/orm/categories';
import {SORT_BY_OPTIONS} from '@/subapps/shop/common/constants';
import {getcategoryids} from '@/subapps/shop/common/utils/categories';
import type {Breadcrumb} from '@/subapps/shop/common/types';

async function Category({
  params,
  searchParams,
}: {
  params: {tenant: string; workspace: string; 'category-slug': string};
  searchParams: {[key: string]: string | undefined};
}) {
  const {search, limit, page, sort} = searchParams;

  const categorySlug = params['category-slug'];

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
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getShopConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return notFound();

  const categories = await findCategories({
    workspace: access.workspace,
    client,
    user,
  }).then(clone);

  const $cats = categories as Category[];

  const getbreadcrumbs = (category: Category): Breadcrumb[] => {
    if (!category) return [];

    let breadcrumbs: Breadcrumb[] = [];

    if (category?.parent?.id) {
      breadcrumbs = [
        ...getbreadcrumbs($cats.find(c => c.id === category?.parent?.id)!),
      ];
    }

    breadcrumbs.push({id: category.id, name: category.name});

    return breadcrumbs;
  };

  const $category = categorySlug
    ? ($cats.find(c => c.slug === categorySlug) ?? null)
    : null;

  if (!$category) {
    return redirect(`${workspaceURI}/shop`);
  }

  const categoryids = $category ? getcategoryids($category) : [];

  const breadcrumbs = $category ? getbreadcrumbs($category) : [];

  const availableSortByOptions = SORT_BY_OPTIONS.filter(
    o => workspaceConfig && (workspaceConfig?.[o.value] as boolean),
  );

  const defaultSort = availableSortByOptions?.[0]?.value;

  const {products, pageInfo} = await findProducts({
    search,
    sort: sort || defaultSort,
    page,
    limit: limit ? Number(limit) : DEFAULT_LIMIT,
    categoryids,
    workspace: access.workspace,
    workspaceConfig,
    user,
    client,
    config,
  });

  const parentcategories = $cats.filter(c => !c.parent);

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    config: workspaceConfig,
    client,
  });

  return (
    <ProductList
      products={clone(products).filter(
        (p): p is NonNullable<typeof p> => p !== null,
      )}
      breadcrumbs={breadcrumbs}
      category={$category}
      categories={parentcategories}
      pageInfo={pageInfo}
      hidePriceAndPurchase={hidePriceAndPurchase}
      config={clone(workspaceConfig)}
      productPath={`${workspaceURI}/shop/category/${$category.slug}/product/`}
      defaultSort={defaultSort}
    />
  );
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; 'category-slug': string}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <Category params={params} searchParams={searchParams} />
    </Suspense>
  );
}
