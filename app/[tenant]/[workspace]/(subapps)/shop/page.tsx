import {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import {findProducts} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/orm/product';
import {shouldHidePricesAndPurchase} from '@/orm/product';
import {
  findCategories,
  findFeaturedCategories,
} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/orm/categories';

import {
  ProductCategories,
  HomeCarousel,
  FeaturedCategories,
  CarouselSkeleton,
  CategoriesSkeleton,
  FeaturedCategoriesSkeleton,
  OrderAlert,
} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/ui/components';

async function Categories({tenant, user, workspace}: any) {
  const categories = await findCategories({
    workspace,
    tenantId: tenant,
    user,
  }).then(clone);

  const parentcategories = categories?.filter((c: any) => !c.parent);

  return <ProductCategories categories={parentcategories} />;
}

async function Carousel({workspace}: any) {
  const carouselList = workspace?.config?.carouselList;

  return <HomeCarousel images={carouselList} />;
}

async function Featured({tenant, user, workspace}: any) {
  const featuredCategories: any = await findFeaturedCategories({
    workspace: workspace!,
    tenantId: tenant,
    user,
  }).then(clone);

  for (const category of featuredCategories) {
    if (category?.productList?.length) {
      const res: any = await findProducts({
        ids: category.productList.map((p: any) => p.id),
        workspace: workspace!,
        user,
        tenantId: tenant,
        categoryids: [category.id],
      }).then(clone);

      category.products = res?.products;
    }
  }

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
    tenantId: tenant,
  });

  return (
    <FeaturedCategories
      categories={featuredCategories}
      workspace={workspace}
      hidePriceAndPurchase={hidePriceAndPurchase}
    />
  );
}

async function Shop({params}: {params: {tenant: string; workspace: string}}) {
  const {tenant} = params;

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL} = workspacePathname(params);

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const featuredCategories: any = await findFeaturedCategories({
    workspace,
    tenantId: tenant,
    user,
  }).then(clone);

  for (const category of featuredCategories) {
    if (category?.productList?.length) {
      const res: any = await findProducts({
        ids: category.productList.map((p: any) => p.id),
        workspace,
        user,
        tenantId: tenant,
        categoryids: [category.id],
      }).then(clone);

      category.products = res?.products;
    }
  }

  return (
    <div>
      <div className="relative">
        <Suspense fallback={<CategoriesSkeleton />}>
          <Categories workspace={workspace} user={user} tenant={tenant} />
        </Suspense>
      </div>
      <Suspense fallback={<CarouselSkeleton />}>
        <Carousel workspace={workspace} />
      </Suspense>
      <div className="container flex flex-col gap-6 mx-auto px-2 mb-4">
        <Suspense fallback={<FeaturedCategoriesSkeleton />}>
          <Featured workspace={workspace} user={user} tenant={tenant} />
        </Suspense>
      </div>
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div>
      <div className="relative">
        <CategoriesSkeleton />
      </div>
      <CarouselSkeleton />
      <div className="container flex flex-col gap-6 mx-auto px-2 mb-4">
        <FeaturedCategoriesSkeleton />
      </div>
    </div>
  );
}

export default function Page({
  params,
}: {
  params: {tenant: string; workspace: string};
}) {
  return (
    <>
      <Suspense fallback={<ShopSkeleton />}>
        <Shop params={params} />
      </Suspense>
      <OrderAlert />
    </>
  );
}
