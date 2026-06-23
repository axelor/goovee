import {Suspense} from 'react';
import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- ///
import {findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getSession} from '@/auth';
import {DEFAULT_LIMIT} from '@/constants';
import type {Category} from '@/types';
import {manager} from '@/tenant';
import {shouldHidePricesAndPurchase} from '@/orm/product';

// ---- LOCAL IMPORTS ---- //
import {
  ProductList,
  ProductListSkeleton,
} from '@/subapps/shop/common/ui/components';
import {findProducts} from '@/subapps/shop/common/orm/product';
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
  const {tenant: tenantId} = params;
  const {search, limit, page, sort} = searchParams;

  const categorySlug = params['category-slug'];

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client, config} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const categories = await findCategories({
    workspace,
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
    o => workspace?.config && (workspace?.config?.[o.value] as boolean),
  );

  const defaultSort = availableSortByOptions?.[0]?.value;

  const {products, pageInfo} = await findProducts({
    search,
    sort: sort || defaultSort,
    page,
    limit: limit ? Number(limit) : DEFAULT_LIMIT,
    categoryids,
    workspace,
    user,
    client,
    config,
  });

  const parentcategories = $cats.filter(c => !c.parent);

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
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
      workspace={workspace}
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
