import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import type {NullableValues} from '@/types/util';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components/breadcrumb';
import {clone} from '@/utils';
import {getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {Suspense} from 'react';
import {MyContributionsTab} from '../common/constants/tabs';
import {
  countMyProducts,
  findCompatibilityVersions,
  findLicenses,
  findProductCategories,
  resolveNewListingCurrency,
} from '../common/orm';
import {PublishNewButton} from '../common/ui/components/buttons/publish-new-button';
import {Await} from '../common/ui/components/primitives/await';
import {Construction} from 'lucide-react';
import {NoticeBanner} from '../common/ui/components/primitives/notice-banner';
import {OverviewTab} from '../common/ui/components/tabs/my-contributions-overview-tab';
import {ProductsTab} from '../common/ui/components/tabs/products-tab';
import {ensureAuth} from '../common/utils/auth-helper';
import {
  myContributionsParamsSchema,
  myContributionsSearchParamsSchema,
  type MyContributionsSearchParams,
} from '../common/utils/validators';

export default async function MyContributionsPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{tab?: string; productsPage?: string}>;
}) {
  const [rawParams, rawSearchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const paramsResult = myContributionsParamsSchema.safeParse(rawParams);
  if (!paramsResult.success) notFound();
  const params = paramsResult.data;

  const searchParamsResult =
    myContributionsSearchParamsSchema.safeParse(rawSearchParams);
  if (!searchParamsResult.success) notFound();
  const searchParams = searchParamsResult.data;

  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);

  const {error, auth, forceLogin} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: false,
  });
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-contributions`,
        workspaceURI,
        tenant: tenantId,
      }),
    );
  }
  if (error) notFound();

  const [categories, licenses, compatibilityVersions, newListingCurrency] =
    await Promise.all([
      findProductCategories({
        client: auth.tenant.client,
        take: 100,
        orderBy: {sequence: 'ASC'},
      }),
      findLicenses({client: auth.tenant.client}),
      findCompatibilityVersions(auth.tenant.client),
      resolveNewListingCurrency({
        client: auth.tenant.client,
        mainPartnerId: auth.user.mainPartnerId,
      }),
    ]);

  const {tab, productsPage} = searchParams;

  const buildQuery = (
    overrides: Partial<NullableValues<MyContributionsSearchParams>> = {},
  ) => {
    const query: Record<string, string> = {};
    if (tab !== 'overview') query.tab = tab;
    if (productsPage !== 1) query.productsPage = String(productsPage);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) {
        delete query[k];
      } else if (v !== undefined) {
        query[k] = String(v);
      }
    }
    return query;
  };

  const tabNavLink = (tabValue: MyContributionsTab) => {
    const params = buildQuery({tab: tabValue});
    const queryStr =
      Object.keys(params).length > 0
        ? `?${new URLSearchParams(params).toString()}`
        : '';
    return `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-contributions${queryStr}`;
  };

  const [
    marketplaceLabel,
    myContribLabel,
    manageDescLabel,
    overviewLabel,
    productsLabel,
    revenueLabel,
    profileLabel,
    comingSoonTitle,
    comingSoonDescription,
  ] = await Promise.all([
    t('Marketplace'),
    t('My contributions'),
    t(
      "Manage the plugins and apps you've published on the Axelor marketplace.",
    ),
    t('Overview'),
    t('Products'),
    t('Revenue'),
    t('Profile'),
    t('Coming soon'),
    t(
      'This section is still being built; what you see below is a preview of the layout.',
    ),
  ]);

  const comingSoonBanner = (
    <NoticeBanner
      icon={Construction}
      title={comingSoonTitle}
      description={comingSoonDescription}
    />
  );

  return (
    <div className="min-h-screen container pb-6">
      {/* Breadcrumb */}
      <div className="mt-6 mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-foreground-muted cursor-pointer truncate text-md">
                <Link href={`${workspaceURI}/${SUBAPP_CODES.marketplace}`}>
                  {marketplaceLabel}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="sm:truncate text-lg font-semibold">
                {myContribLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {myContribLabel}
            </h1>
            <p className="text-muted-foreground text-sm">{manageDescLabel}</p>
          </div>
          {auth.workspace.config.allowToPublish && (
            <PublishNewButton
              workspaceURI={workspaceURI}
              workspaceURL={workspaceURL}
              categories={clone(categories)}
              licenses={clone(licenses)}
              compatibilityVersions={clone(compatibilityVersions)}
              requiresReview={auth.workspace.config.requiresReview === true}
              allowToPublish={auth.workspace.config.allowToPublish === true}
              newListingCurrency={clone(newListingCurrency)}
              inAti={
                auth.workspace.config.defaultProductForMarketplace?.inAti ===
                true
              }
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="pb-6">
        <div className="border-b border-border flex overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href={tabNavLink(MyContributionsTab.Overview)}
            className={`px-6 pt-4 pb-3 font-medium transition-colors border-b-2 ${
              tab === MyContributionsTab.Overview
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}>
            {overviewLabel}
          </Link>
          <Link
            href={tabNavLink(MyContributionsTab.Products)}
            className={`px-6 pt-4 pb-3 font-medium transition-colors border-b-2 ${
              tab === MyContributionsTab.Products
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}>
            {productsLabel} (
            <Suspense fallback="...">
              <Await
                promise={countMyProducts({
                  mainPartnerId: auth.user.mainPartnerId,
                  client: auth.tenant.client,
                  workspace: auth.workspace,
                })}
              />
            </Suspense>
            )
          </Link>
          <Link
            href={tabNavLink(MyContributionsTab.Revenue)}
            className={`px-6 pt-4 pb-3 font-medium transition-colors border-b-2 ${
              tab === MyContributionsTab.Revenue
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}>
            {revenueLabel}
          </Link>
          <Link
            href={tabNavLink(MyContributionsTab.Profile)}
            className={`px-6 pt-4 pb-3 font-medium transition-colors border-b-2 ${
              tab === MyContributionsTab.Profile
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}>
            {profileLabel}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div>
        {tab === MyContributionsTab.Overview && <OverviewTab />}
        {tab === MyContributionsTab.Products && (
          <ProductsTab
            mainPartnerId={auth.user.mainPartnerId}
            client={auth.tenant.client}
            workspace={auth.workspace}
            newListingCurrency={newListingCurrency}
            workspaceURI={workspaceURI}
            workspaceURL={workspaceURL}
            categories={categories}
            licenses={licenses}
            compatibilityVersions={compatibilityVersions}
            page={productsPage}
          />
        )}
        {tab === MyContributionsTab.Revenue && comingSoonBanner}
        {tab === MyContributionsTab.Profile && comingSoonBanner}
      </div>
    </div>
  );
}
