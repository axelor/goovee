import {Suspense} from 'react';
import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {clone, htmlToNormalString} from '@/utils';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {
  ProductView,
  ProductViewSkeleton,
} from '@/subapps/shop/common/ui/components';
import {findProductBySlug} from '@/subapps/shop/common/orm/product';
import {shouldHidePricesAndPurchase} from '@/orm/product';
import {findCategories} from '@/subapps/shop/common/orm/categories';
import {findModelFields} from '@/orm/model-fields';
import {
  BASE_PRODUCT_MODEL,
  PRODUCT_ATTRS,
} from '@/subapps/shop/common/constants';
import {transformMetaFields} from '@/subapps/shop/common/utils/meta-field-value';

export async function generateMetadata(
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'category-slug': string;
      'product-slug': string;
    }>;
  }
) {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);

  const categorySlug = params['category-slug'];
  const productSlug = params['product-slug'];

  const session = await getSession();
  const user = session?.user;

  const workspace = await findWorkspace({
    user: user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return null;
  }

  const categories = await findCategories({
    workspace,
    tenantId: tenant,
    user,
  }).then(clone);

  const $category: any = categories.find((c: any) => c.slug === categorySlug);

  if (!$category) {
    return null;
  }

  const computedProduct = await findProductBySlug({
    slug: productSlug,
    workspace,
    user,
    tenantId: tenant,
    categoryids: $category.id,
  });

  if (!computedProduct?.product) {
    return null;
  }

  const {product} = computedProduct;

  return {
    title: product?.name,
    description: htmlToNormalString(product?.description),
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
  const {tenant} = params;

  const categorySlug = params['category-slug'];

  const session = await getSession();
  const user = session?.user;

  const productSlug = params['product-slug'];

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  if (!(productSlug && categorySlug)) {
    return redirect(`${workspaceURI}/shop`);
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const categories = await findCategories({
    workspace,
    tenantId: tenant,
    user,
  }).then(clone);

  const $category: any = categories.find((c: any) => c.slug === categorySlug);

  if (!$category) {
    return redirect(`${workspaceURI}/shop`);
  }

  const computedProduct = await findProductBySlug({
    slug: productSlug,
    workspace,
    user,
    tenantId: tenant,
    categoryids: $category.id,
  });

  if (!computedProduct) redirect(`${workspaceURI}/shop`);

  const metaFields = await findModelFields({
    modelName: BASE_PRODUCT_MODEL,
    modelField: PRODUCT_ATTRS,
    tenantId: tenant,
  }).then(clone);

  const metaFieldsValues = await transformMetaFields(
    metaFields,
    computedProduct?.product?.productAttrs,
    tenant,
  );

  let breadcrumbs: any = [];

  const getbreadcrumbs: any = (category: any) => {
    if (!category) return [];

    let breadcrumbs: any = [];

    if (category?.parent?.id) {
      breadcrumbs = [
        ...getbreadcrumbs(
          categories.find((c: any) => c.id === category?.parent?.id),
        ),
      ];
    }

    breadcrumbs.push({id: category.id, name: category.name});

    return breadcrumbs;
  };

  breadcrumbs = $category ? getbreadcrumbs($category) : [];

  const {product} = computedProduct;

  if (breadcrumbs.length) {
    breadcrumbs.push({id: product.id, name: product.name});
  }

  const parentcategories = categories?.filter((c: any) => !c.parent);

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
    tenantId: tenant,
  });

  return (
    <ProductView
      hidePriceAndPurchase={hidePriceAndPurchase}
      product={clone(computedProduct)}
      workspace={workspace}
      breadcrumbs={breadcrumbs}
      categories={parentcategories}
      metaFields={metaFieldsValues}
    />
  );
}

export default async function Page(
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'product-slug': string;
      'category-slug': string;
    }>;
    searchParams: Promise<{[key: string]: string}>;
  }
) {
  const params = await props.params;
  return (
    <Suspense fallback={<ProductViewSkeleton />}>
      <Product params={params} />
    </Suspense>
  );
}
