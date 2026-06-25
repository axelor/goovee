import {Suspense} from 'react';
import type {Cloned} from '@/types/util';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getWorkspaceConfig} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import type {TenantConfig} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import type {User, Category, ComputedProduct} from '@/types';
import type {PortalAppConfig, WorkspaceLight} from '@/orm/workspace';

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
import type {FeaturedCategory} from '@/subapps/shop/common/types';

async function Categories({
  client,
  user,
  workspace,
}: {
  client: Client;
  user: User | undefined;
  workspace: WorkspaceLight | Cloned<WorkspaceLight>;
}) {
  const categories = await findCategories({
    workspace,
    client,
    user,
  }).then(clone);

  const parentcategories = (categories as Category[])?.filter(c => !c.parent);

  return <ProductCategories categories={parentcategories} />;
}

async function Carousel({
  config,
}: {
  config: PortalAppConfig | Cloned<PortalAppConfig>;
}) {
  const carouselList = config?.carouselList;

  return <HomeCarousel images={carouselList} />;
}

async function Featured({
  client,
  config,
  workspaceConfig,
  user,
  workspace,
}: {
  client: Client;
  config: TenantConfig;
  workspaceConfig: PortalAppConfig | Cloned<PortalAppConfig>;
  user: User | undefined;
  workspace: WorkspaceLight | Cloned<WorkspaceLight>;
}) {
  const featuredCategories = (await findFeaturedCategories({
    workspace: workspace!,
    client,
    user,
  }).then(clone)) as FeaturedCategory[];

  for (const category of featuredCategories) {
    if (category?.productList?.length) {
      const res = await findProducts({
        ids: category.productList.map(p => p.id),
        workspace: workspace!,
        workspaceConfig,
        user,
        client,
        config,
        categoryids: [category.id],
      }).then(clone);

      category.products = (res as {products: ComputedProduct[]})?.products;
    }
  }

  const hidePriceAndPurchase = await shouldHidePricesAndPurchase({
    user,
    config: workspaceConfig,
    client,
  });

  return (
    <FeaturedCategories
      categories={featuredCategories}
      config={workspaceConfig}
      hidePriceAndPurchase={hidePriceAndPurchase}
    />
  );
}

async function Shop({params}: {params: {tenant: string; workspace: string}}) {
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

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

  return (
    <div>
      <div className="relative">
        <Suspense fallback={<CategoriesSkeleton />}>
          <Categories
            workspace={access.workspace}
            user={user}
            client={client}
          />
        </Suspense>
      </div>
      <Suspense fallback={<CarouselSkeleton />}>
        <Carousel config={workspaceConfig} />
      </Suspense>
      <div className="container flex flex-col gap-6 mx-auto px-2 mb-4">
        <Suspense fallback={<FeaturedCategoriesSkeleton />}>
          <Featured
            workspace={access.workspace}
            workspaceConfig={workspaceConfig}
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
