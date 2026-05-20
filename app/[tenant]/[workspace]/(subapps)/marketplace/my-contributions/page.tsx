import Link from 'next/link';
import {Suspense} from 'react';
import {SUBAPP_CODES} from '@/constants';
import {DEFAULT_MARKETPLACE_TYPE_SEGMENT} from '../common/constants/route-types';
import {workspacePathname} from '@/utils/workspace';
import {clone} from '@/utils';
// clone is applied at server→client boundaries only.
import {ensureAuth} from '../common/utils/auth-helper';
import {notFound, redirect} from 'next/navigation';
import {getLoginURL} from '@/utils/url';
import {OverviewTab} from '../common/ui/components/my-contributions-tab/my-contributions-overview-tab';
import {SkillsTab} from '../common/ui/components/my-contributions-tab/skills-tab';
import {AppsTab} from '../common/ui/components/my-contributions-tab/apps-tab';
import {ComingSoonBanner} from '../common/ui/components/my-contributions-tab/coming-soon-banner';
import {
  findProductCategories,
  findCompatibilityVersions,
} from '../common/orm/orm';
import {PublishNewLauncher} from './client-launcher';
import {SkillsCountBadge} from '../common/ui/components/my-contributions-tab/skills-count-badge';
import {AppsCountBadge} from '../common/ui/components/my-contributions-tab/apps-count-badge';
import {MyContributionsTab} from '../common/constants/tabs';
import {t} from '@/locale/server';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components/breadcrumb';

export default async function MyContributionsPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{tab?: string; skillsPage?: string; appsPage?: string}>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
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

  const [categories, compatibilityVersions] = await Promise.all([
    findProductCategories({
      client: auth.tenant.client,
      workspace: auth.workspace,
      take: 100,
    }),
    findCompatibilityVersions(auth.tenant.client),
  ]);

  const currentTab = (searchParams.tab ||
    MyContributionsTab.Overview) as MyContributionsTab;
  const skillsPage = searchParams.skillsPage
    ? parseInt(searchParams.skillsPage)
    : 1;
  const appsPage = searchParams.appsPage ? parseInt(searchParams.appsPage) : 1;

  const tabNavLink = (tab: string) =>
    `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-contributions?tab=${tab}`;

  const [
    marketplaceLabel,
    myContribLabel,
    manageDescLabel,
    overviewLabel,
    skillsLabel,
    appsLabel,
    revenueLabel,
    profileLabel,
  ] = await Promise.all([
    t('Marketplace'),
    t('My contributions'),
    t(
      "Manage the plugins and apps you've published on the Axelor marketplace.",
    ),
    t('Overview'),
    t('Skills'),
    t('Apps'),
    t('Revenue'),
    t('Profile'),
  ]);

  return (
    <div className="min-h-screen container pb-6">
      {/* Breadcrumb */}
      <div className="my-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-foreground-muted cursor-pointer truncate text-md">
                <Link
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/${DEFAULT_MARKETPLACE_TYPE_SEGMENT}`}>
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
      <div className="py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {myContribLabel}
            </h1>
            <p className="text-muted-foreground text-sm">{manageDescLabel}</p>
          </div>
          {auth.workspace.config.allowToPublish && (
            <PublishNewLauncher
              workspaceURI={workspaceURI}
              workspaceURL={workspaceURL}
              categories={clone(categories)}
              compatibilityVersions={clone(compatibilityVersions)}
              requiresReview={auth.workspace.config.requiresReview === true}
              allowToPublish={auth.workspace.config.allowToPublish === true}
              currencySymbol={
                auth.workspace.config.marketplaceDefaultSaleCurrency?.symbol
              }
              inAti={auth.workspace.config.marketplaceInAti === true}
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
              currentTab === MyContributionsTab.Overview
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}>
            {overviewLabel}
          </Link>
          <Link
            href={tabNavLink(MyContributionsTab.Skills)}
            className={`px-6 pt-4 pb-3 font-medium transition-colors border-b-2 ${
              currentTab === MyContributionsTab.Skills
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}>
            {skillsLabel} (
            <Suspense fallback="...">
              <SkillsCountBadge
                partnerId={auth.user.mainPartnerId}
                client={auth.tenant.client}
                workspace={auth.workspace}
              />
            </Suspense>
            )
          </Link>
          <Link
            href={tabNavLink(MyContributionsTab.Apps)}
            className={`px-6 pt-4 pb-3 font-medium transition-colors border-b-2 ${
              currentTab === MyContributionsTab.Apps
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}>
            {appsLabel} (
            <Suspense fallback="...">
              <AppsCountBadge
                partnerId={auth.user.mainPartnerId}
                client={auth.tenant.client}
                workspace={auth.workspace}
              />
            </Suspense>
            )
          </Link>
          <Link
            href={tabNavLink(MyContributionsTab.Revenue)}
            className={`px-6 pt-4 pb-3 font-medium transition-colors border-b-2 ${
              currentTab === MyContributionsTab.Revenue
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}>
            {revenueLabel}
          </Link>
          <Link
            href={tabNavLink(MyContributionsTab.Profile)}
            className={`px-6 pt-4 pb-3 font-medium transition-colors border-b-2 ${
              currentTab === MyContributionsTab.Profile
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}>
            {profileLabel}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div>
        {currentTab === MyContributionsTab.Overview && <OverviewTab />}
        {currentTab === MyContributionsTab.Skills && (
          <SkillsTab
            partnerId={auth.user.mainPartnerId}
            client={auth.tenant.client}
            workspace={auth.workspace}
            workspaceURI={workspaceURI}
            workspaceURL={workspaceURL}
            categories={categories}
            compatibilityVersions={compatibilityVersions}
            page={skillsPage}
          />
        )}
        {currentTab === MyContributionsTab.Apps && (
          <AppsTab
            partnerId={auth.user.mainPartnerId}
            client={auth.tenant.client}
            workspace={auth.workspace}
            workspaceURI={workspaceURI}
            workspaceURL={workspaceURL}
            categories={categories}
            compatibilityVersions={compatibilityVersions}
            page={appsPage}
          />
        )}
        {currentTab === MyContributionsTab.Revenue && (
          <ComingSoonBanner area={await t('Revenue')} />
        )}
        {currentTab === MyContributionsTab.Profile && (
          <ComingSoonBanner area={await t('Profile')} />
        )}
      </div>
    </div>
  );
}
