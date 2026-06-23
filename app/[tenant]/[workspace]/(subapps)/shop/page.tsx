import {Suspense} from 'react';
import type {Cloned} from '@/types/util';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace} from '@/orm/workspace';
import {manager} from '@/tenant';
import type {TenantConfig} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import type {User} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';

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

async function Categories({
  client,
  user,
  workspace,
}: {
  client: Client;
  user: User | undefined;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  const categories = await findCategories({
    workspace,
    client,
    user,
  }).then(clone);

  const parentcategories = categories?.filter((c: any) => !c.parent);

  return <ProductCategories categories={parentcategories} />;
}

async function Carousel({workspace}: any) {
  const carouselList = workspace?.config?.carouselList;

  return <HomeCarousel images={carouselList} />;
}

async function Featured({
  client,
  config,
  user,
  workspace,
}: {
  client: Client;
  config: TenantConfig;
  user: User | undefined;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  const featuredCategories: any = await findFeaturedCategories({
    workspace: workspace!,
    client,
    user,
  }).then(clone);

  for (const category of featuredCategories) {
    if (category?.productList?.length) {
      const res: any = await findProducts({
        ids: category.productList.map((p: any) => p.id),
        workspace: workspace!,
        user,
        client,
        config,
        categoryids: [category.id],
      }).then(clone);

      category.products = res?.products;
    }
  }

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    workspace,
    client,
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
  const {tenant: tenantId} = params;

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL} = workspacePathname(params);

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

  return (
    <div>
      <div className="relative">
        <Suspense fallback={<CategoriesSkeleton />}>
          <Categories workspace={workspace} user={user} client={client} />
        </Suspense>
      </div>
      <Suspense fallback={<CarouselSkeleton />}>
        <Carousel workspace={workspace} />
      </Suspense>
      <div className="container flex flex-col gap-6 mx-auto px-2 mb-4">
        <Suspense fallback={<FeaturedCategoriesSkeleton />}>
          <Featured
            workspace={workspace}
            user={user}
            client={client}
            config={config}
          />
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

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  return (
    <>
      <Suspense fallback={<ShopSkeleton />}>
        <Shop params={params} />
      </Suspense>
      <OrderAlert />
    </>
  );
}
