import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';
import {Metadata} from 'next';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getWorkspaceConfig} from '@/orm/workspace';
import {clone, htmlToNormalString} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import type {Category} from '@/types';
import {findModelFields} from '@/orm/model-fields';
import {shouldHidePricesAndPurchase} from '@/orm/product';

// ---- LOCAL IMPORTS ---- //
import {
  ProductView,
  ProductViewSkeleton,
} from '@/subapps/shop/common/ui/components';
import {findProductBySlug} from '@/subapps/shop/common/orm/product';
import {findCategories} from '@/subapps/shop/common/orm/categories';
import {
  BASE_PRODUCT_MODEL,
  PRODUCT_ATTRS,
} from '@/subapps/shop/common/constants';
import {transformMetaFields} from '@/subapps/shop/common/utils/meta-field-value';
import type {Breadcrumb} from '@/subapps/shop/common/types';

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

  const categorySlug = params['category-slug'];
  const productSlug = params['product-slug'];

  const access = await ensureAuth({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) return null;

  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return null;

  const workspace = clone({...access.workspace, config: workspaceConfig});

  const categories = await findCategories({
    workspace,
    client,
    user,
  }).then(clone);

  const $category =
    (categories as Category[]).find(c => c.slug === categorySlug) ?? null;

  if (!$category) {
    return null;
  }

  const computedProduct = await findProductBySlug({
    slug: productSlug,
    workspace,
    workspaceConfig: workspace.config,
    user,
    client,
    config,
    categoryids: [$category.id],
  });

  if (!computedProduct?.product) {
    return null;
  }

  const {product} = computedProduct;

  return {
    title: product?.name,
    description: htmlToNormalString(product?.description ?? ''),
  };
}

async function Product({
  params,
}: {
  params: {
    tenant: string;
    workspace: string;
    'product-slug': string;
    'category-slug': string;
  };
}) {
  const categorySlug = params['category-slug'];

  const productSlug = params['product-slug'];

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  if (!(productSlug && categorySlug)) {
    return redirect(`${workspaceURI}/shop`);
  }

  const access = await ensureAuth({
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

  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return notFound();

  const workspace = clone({...access.workspace, config: workspaceConfig});

  const categories = await findCategories({
    workspace,
    client,
    user,
  }).then(clone);

  const $category =
    (categories as Category[]).find(c => c.slug === categorySlug) ?? null;

  if (!$category) {
    return redirect(`${workspaceURI}/shop`);
  }

  const computedProduct = await findProductBySlug({
    slug: productSlug,
    workspace,
    workspaceConfig: workspace.config,
    user,
    client,
    config,
    categoryids: [$category.id],
  });

  if (!computedProduct) redirect(`${workspaceURI}/shop`);

  const metaFields = await findModelFields({
    modelName: BASE_PRODUCT_MODEL,
    modelField: PRODUCT_ATTRS,
    client,
  }).then(clone);

  const metaFieldsValues = await transformMetaFields(
    metaFields,
    computedProduct?.product?.productAttrs as unknown as Record<
      string,
      unknown
    >,
    client,
  );

  const $cats = categories as Category[];

  const getbreadcrumbs = (category: Category): Breadcrumb[] => {
    if (!category) return [];

    let bc: Breadcrumb[] = [];

    if (category?.parent?.id) {
      bc = [...getbreadcrumbs($cats.find(c => c.id === category?.parent?.id)!)];
    }

    bc.push({id: category.id, name: category.name});

    return bc;
  };

  let breadcrumbs: Breadcrumb[] = $category ? getbreadcrumbs($category) : [];

  const {product} = computedProduct;

  if (breadcrumbs.length) {
    breadcrumbs.push({id: product.id, name: product.name ?? ''});
  }

  const parentcategories = $cats.filter(c => !c.parent);

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    config: workspace.config,
    client,
  });

  return (
    <ProductView
      hidePriceAndPurchase={hidePriceAndPurchase}
      product={clone(computedProduct)}
      config={workspace.config}
      breadcrumbs={breadcrumbs}
      categories={parentcategories}
      metaFields={metaFieldsValues}
    />
  );
}

export default async function Page(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    'product-slug': string;
    'category-slug': string;
  }>;
  searchParams: Promise<{[key: string]: string}>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<ProductViewSkeleton />}>
      <Product params={params} />
    </Suspense>
  );
}
