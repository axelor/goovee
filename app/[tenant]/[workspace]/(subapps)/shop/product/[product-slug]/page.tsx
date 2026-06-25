import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';
import {Metadata} from 'next';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {clone, htmlToNormalString} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import type {Category} from '@/types';
import {findModelFields} from '@/orm/model-fields';

// ---- LOCAL IMPORTS ---- //
import {
  ProductView,
  ProductViewSkeleton,
} from '@/subapps/shop/common/ui/components';
import {findProductBySlug} from '@/subapps/shop/common/orm/product';
import {getShopConfig} from '@/subapps/shop/common/orm/config';
import {shouldHidePricesAndPurchase} from '@/orm/product';
import {findCategories} from '@/subapps/shop/common/orm/categories';
import {getcategoryids} from '@/subapps/shop/common/utils/categories';
import {transformMetaFields} from '@/subapps/shop/common/utils/meta-field-value';
import {
  BASE_PRODUCT_MODEL,
  PRODUCT_ATTRS,
} from '@/subapps/shop/common/constants';
import type {Breadcrumb} from '@/subapps/shop/common/types';

export async function generateMetadata(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    'product-slug': string;
  }>;
}): Promise<Metadata | null> {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
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

  const workspaceConfig = await getShopConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return null;

  const categories = await findCategories({
    workspace: access.workspace,
    client,
  }).then(clone);

  const categoryids = categories.map(c => getcategoryids(c)).flat();

  const computedProduct = await findProductBySlug({
    slug: productSlug,
    workspace: access.workspace,
    workspaceConfig,
    user,
    client,
    config,
    categoryids,
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
  params: {tenant: string; workspace: string; 'product-slug': string};
}) {
  const productSlug = params['product-slug'];
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  if (!productSlug) redirect(`${workspaceURI}/shop`);

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

  const workspaceConfig = await getShopConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return notFound();

  const categories = await findCategories({
    workspace: access.workspace,
    client,
  }).then(clone);

  const categoryids = categories.map(c => getcategoryids(c)).flat();

  const computedProduct = await findProductBySlug({
    slug: productSlug,
    workspace: access.workspace,
    workspaceConfig,
    user,
    client,
    config,
    categoryids,
  });

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

  if (!computedProduct) redirect(`${workspaceURI}/shop`);

  const breadcrumbs: Breadcrumb[] = [];
  const {product} = computedProduct;

  if (breadcrumbs.length) {
    breadcrumbs.push({id: product.id, name: product.name ?? ''});
  }

  const parentcategories = (categories as Category[]).filter(c => !c.parent);

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    config: workspaceConfig,
    client,
  });

  return (
    <ProductView
      hidePriceAndPurchase={hidePriceAndPurchase}
      product={clone(computedProduct)}
      config={clone(workspaceConfig)}
      breadcrumbs={breadcrumbs}
      categories={parentcategories}
      metaFields={metaFieldsValues}
    />
  );
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; 'product-slug': string}>;
  searchParams: Promise<{[key: string]: string}>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<ProductViewSkeleton />}>
      <Product params={params} />
    </Suspense>
  );
}
