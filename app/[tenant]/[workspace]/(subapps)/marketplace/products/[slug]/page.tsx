import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import type {NullableValues} from '@/types/util';
import {t} from '@/locale/server';
import {Badge, Button} from '@/ui/components';
import {Avatar, AvatarImage} from '@/ui/components/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components/breadcrumb';
import {cn} from '@/utils/css';
import {getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import {Eye} from 'lucide-react';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Suspense} from 'react';
import {MARKETPLACE_TYPE} from '../../common/constants/marketplace-types';
import {MARKETPLACE_TYPE_SEGMENT} from '../../common/constants/route-types';
import {MARKETPLACE_VERSION_STATUS_LABELS} from '../../common/constants/statuses';
import {ProductTab} from '../../common/constants/tabs';
import {findProduct, findVersionCount} from '../../common/orm';
import {ProductHeaderCard} from '../../common/ui/components/cards/product-header-card';
import {NoticeBanner} from '../../common/ui/components/primitives/notice-banner';
import {TooltipDate} from '../../common/ui/components/primitives/tooltip-date';
import {OverviewTab} from '../../common/ui/components/tabs/overview-tab';
import {ReviewsTab} from '../../common/ui/components/tabs/reviews-tab';
import {SupportTab} from '../../common/ui/components/tabs/support-tab';
import {VersionsTab} from '../../common/ui/components/tabs/versions-tab';
import {ensureAuth} from '../../common/utils/auth-helper';
import {
  productPageParamsSchema,
  productSearchParamsSchema,
  type ProductSearchParams,
} from '../../common/utils/validators';
import {formatVersionNumber} from '../../common/utils/version-number';

export default async function ProductPage(props: {
  params: Promise<{tenant: string; workspace: string; slug: string}>;
  searchParams: Promise<{
    tab?: string;
    reviewPage?: string;
    versionPage?: string;
    preview?: string;
  }>;
}) {
  const [rawParams, rawSearchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const paramsResult = productPageParamsSchema.safeParse(rawParams);
  if (!paramsResult.success) notFound();
  const params = paramsResult.data;

  const searchParamsResult =
    productSearchParamsSchema.safeParse(rawSearchParams);
  if (!searchParamsResult.success) notFound();
  const searchParams = searchParamsResult.data;

  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);

  const {error, auth} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: true,
  });
  if (error) notFound();

  const client = auth.tenant.client;

  const {tab, reviewPage, versionPage, preview} = searchParams;

  const product = await findProduct({
    slug: params.slug,
    client,
    workspace: auth.workspace,
    mainPartnerId: auth.user?.mainPartnerId,
    preview,
  });

  if (!product) notFound();

  const isApp = product.marketplaceTypeSelect === MARKETPLACE_TYPE.APP;
  const hubSegment = isApp
    ? MARKETPLACE_TYPE_SEGMENT.APPS
    : MARKETPLACE_TYPE_SEGMENT.SKILLS;
  const hubLabel = isApp ? await t('Apps Studio') : await t('Skills Hub');
  const categoryName = product.productCategory?.name ?? null;

  const buildQuery = (
    overrides: Partial<NullableValues<ProductSearchParams>> = {},
  ) => {
    const query: Record<string, string> = {};
    if (tab !== ProductTab.Overview) query.tab = tab;
    if (reviewPage !== 1) query.reviewPage = String(reviewPage);
    if (versionPage !== 1) query.versionPage = String(versionPage);
    if (preview) query.preview = '1';
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) {
        delete query[k];
      } else if (v !== undefined) {
        query[k] = String(v);
      }
    }
    return query;
  };

  const productUrl = (
    overrides?: Partial<NullableValues<ProductSearchParams>>,
  ) => {
    const params = buildQuery(overrides);
    const queryStr =
      Object.keys(params).length > 0
        ? `?${new URLSearchParams(params).toString()}`
        : '';
    return `${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}${queryStr}`;
  };

  const tabNavLink = (tabValue: ProductTab) => productUrl({tab: tabValue});

  const ratingCount = Number(product.ratingCount || 0);

  const [
    overviewLabel,
    versionsLabel,
    reviewsLabel,
    supportLabel,
    detailsLabel,
    versionLabel,
    updatedLabel,
    publishedLabel,
    sizeLabel,
    compatibilityLabel,
    noCompatibleLabel,
    categoryLabel,
    licenseLabel,
    aboutAuthorLabel,
    authorLabel,
    verifiedContributorLabel,
    viewProfileLabel,
    notAvailableLabel,
  ] = await Promise.all([
    t('Overview'),
    t('Versions'),
    t('Reviews ({0})', String(ratingCount)),
    t('Support'),
    t('Details'),
    t('Version'),
    t('Updated'),
    t('Published'),
    t('Size'),
    t('Compatibility'),
    t('No compatible versions specified'),
    t('Category'),
    t('License'),
    t('About the author'),
    t('Author'),
    t('Verified contributor'),
    t('View profile'),
    t('N/A'),
  ]);

  const previewStatus = product.currentVersion?.statusSelect ?? null;
  const previewStatusLabel =
    previewStatus && MARKETPLACE_VERSION_STATUS_LABELS[previewStatus]
      ? await t(MARKETPLACE_VERSION_STATUS_LABELS[previewStatus])
      : null;

  return (
    <div className="min-h-screen">
      {preview && (
        <NoticeBanner
          variant="bar"
          icon={Eye}
          title={await t('Preview — not yet visible to buyers.')}
          description={await t('Buttons and actions are inactive in preview.')}>
          {previewStatusLabel && (
            <Badge variant="outline">{previewStatusLabel}</Badge>
          )}
        </NoticeBanner>
      )}
      {/* Breadcrumb */}
      <div className="container my-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-foreground-muted cursor-pointer truncate text-md">
                <Link
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/${hubSegment}`}>
                  {hubLabel}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {categoryName && product.productCategory?.id && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    asChild
                    className="text-foreground-muted cursor-pointer truncate text-md">
                    <Link
                      href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/${hubSegment}?category=${product.productCategory.id}`}>
                      {categoryName}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="sm:truncate text-lg font-semibold">
                {product.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Product Header Card */}
      <div className="container py-8">
        <ProductHeaderCard
          product={product}
          client={client}
          user={auth.user}
          workspaceURL={workspaceURL}
          workspaceURI={workspaceURI}
          tenantId={tenantId}
          preview={preview}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border sticky top-0 backdrop-blur-sm z-10">
        <div className="container flex overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href={tabNavLink(ProductTab.Overview)}
            className={cn(
              'px-6 pt-4 pb-3 font-medium transition-colors border-b-2',
              tab === ProductTab.Overview
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}>
            {overviewLabel}
          </Link>
          <Link
            href={tabNavLink(ProductTab.Versions)}
            className={cn(
              'px-6 pt-4 pb-3 font-medium transition-colors border-b-2',
              tab === ProductTab.Versions
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}>
            {versionsLabel} (
            <Suspense fallback="...">
              <VersionCountBadge
                productId={product.id}
                client={client}
                preview={preview}
              />
            </Suspense>
            )
          </Link>
          <Link
            href={tabNavLink(ProductTab.Reviews)}
            className={cn(
              'px-6 pt-4 pb-3 font-medium transition-colors border-b-2',
              tab === ProductTab.Reviews
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}>
            {reviewsLabel}
          </Link>
          <Link
            href={tabNavLink(ProductTab.Support)}
            className={cn(
              'px-6 pt-4 pb-3 font-medium transition-colors border-b-2',
              tab === ProductTab.Support
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}>
            {supportLabel}
          </Link>
        </div>
      </div>

      {/* Content with Static Sidebar */}
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Changes with tabs */}
          <div className="lg:col-span-2">
            {tab === ProductTab.Overview && (
              <OverviewTab product={product} tenantId={tenantId} />
            )}
            {tab === ProductTab.Versions && (
              <VersionsTab
                product={product}
                workspaceURI={workspaceURI}
                client={client}
                versionPage={versionPage}
                currentVersionId={product.currentVersion?.id}
                preview={preview}
                buildPageHref={page => productUrl({versionPage: page})}
              />
            )}
            {tab === ProductTab.Reviews && (
              <ReviewsTab
                product={product}
                workspaceURI={workspaceURI}
                workspaceURL={workspaceURL}
                tenantId={tenantId}
                client={client}
                reviewPage={reviewPage}
                user={auth.user}
                preview={preview}
                loginHref={getLoginURL({
                  callbackurl: productUrl({tab: ProductTab.Reviews}),
                  workspaceURI,
                  tenant: tenantId,
                })}
              />
            )}
            {tab === ProductTab.Support && <SupportTab product={product} />}
          </div>

          {/* Static Sidebar - Always Visible */}
          <div className="space-y-6">
            {/* Details Card */}
            <div className="bg-card rounded-lg border border-border p-4 md:p-8 space-y-6">
              <h3 className="text-lg font-bold text-foreground">
                {detailsLabel}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {versionLabel}
                  </span>
                  <span className="font-semibold text-foreground">
                    {product.currentVersion
                      ? formatVersionNumber(product.currentVersion)
                      : notAvailableLabel}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {updatedLabel}
                  </span>
                  {product.currentVersion?.dateOfPublish ? (
                    <TooltipDate
                      date={product.currentVersion.dateOfPublish}
                      displayType="relative"
                      showTooltip={true}
                      className="font-semibold text-foreground"
                    />
                  ) : (
                    <span className="font-semibold text-foreground">
                      {notAvailableLabel}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {publishedLabel}
                  </span>
                  {product.createdOn ? (
                    <TooltipDate
                      date={product.createdOn}
                      displayType="simple"
                      format="MMM YYYY"
                      className="font-semibold text-foreground"
                    />
                  ) : (
                    <span className="font-semibold text-foreground">
                      {notAvailableLabel}
                    </span>
                  )}
                </div>
                {product.currentVersion?.bundleFile?.sizeText && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {sizeLabel}
                    </span>
                    <span className="font-semibold text-foreground">
                      {product.currentVersion.bundleFile.sizeText}
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground block mb-2">
                    {compatibilityLabel}
                  </span>
                  {product.currentVersion?.compatibilitySet &&
                  product.currentVersion.compatibilitySet.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {product.currentVersion.compatibilitySet.map(version => (
                        <span
                          key={version.id}
                          className="inline-block px-2 py-1 bg-muted rounded text-xs text-foreground">
                          {version.title}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {noCompatibleLabel}
                    </p>
                  )}
                </div>
                <div className="border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">
                    {categoryLabel}
                  </span>
                  <p className="font-semibold text-foreground">
                    {categoryName ?? '—'}
                  </p>
                </div>
                <div className="border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">
                    {licenseLabel}{' '}
                    <span className="text-xs text-palette-amber">
                      (Hardcoded)
                    </span>
                  </span>
                  {/* TODO: license isn't modelled on the product yet — this
                      value is a placeholder. Plug in a real source before
                      shipping past demo. */}
                  <p className="font-semibold text-foreground">MIT</p>
                </div>
              </div>
            </div>

            {/* About Author Card */}
            {product.defaultSupplierPartner && (
              <div className="bg-card rounded-lg border border-border p-4 md:p-8 space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  {aboutAuthorLabel}
                </h3>
                <div className="flex items-start gap-4">
                  <Avatar className="rounded-full h-12 w-12 flex-shrink-0">
                    <AvatarImage
                      src={
                        product.defaultSupplierPartner.picture?.id
                          ? `/api/tenant/${tenantId}/partner/image/${product.defaultSupplierPartner.picture.id}`
                          : NO_IMAGE_URL
                      }
                      alt={
                        product.defaultSupplierPartner.simpleFullName ||
                        authorLabel
                      }
                      size={48}
                    />
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {product.defaultSupplierPartner.simpleFullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {verifiedContributorLabel}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full rounded-full">
                  {viewProfileLabel}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

async function VersionCountBadge({
  productId,
  client,
  preview,
}: {
  productId: string;
  client: Client;
  preview: boolean;
}) {
  const versionCount = await findVersionCount({
    client,
    productId,
    includeUnpublished: preview,
  });

  return <>{versionCount}</>;
}
