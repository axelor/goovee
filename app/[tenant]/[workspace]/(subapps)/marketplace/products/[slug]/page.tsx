import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {t} from '@/locale/server';
import {formatNumber} from '@/locale/server/formatters';
import type {ID} from '@/types';
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
import {InnerHTML} from '@/ui/components/inner-html';
import {cn} from '@/utils/css';
import {getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import {Download, FileText} from 'lucide-react';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Suspense} from 'react';
import {DEFAULT_GRADIENT, GRADIENT_MAP} from '../../common/constants/gradients';
import {MARKETPLACE_TYPE} from '../../common/constants/marketplace-types';
import {MARKETPLACE_TYPE_SEGMENT} from '../../common/constants/route-types';
import {MARKETPLACE_VERSION_STATUS} from '../../common/constants/statuses';
import {ProductTab} from '../../common/constants/tabs';
import {findProduct, isProductFavorited} from '../../common/orm';
import {formatVersionNumber} from '../../common/utils/version-number';
import {AddToFavoriteButton} from '../../common/ui/components/buttons/add-to-favorite-button';
import {BuyButtons} from '../../common/ui/components/buttons/buy-buttons';
import {ProductIcon} from '../../common/ui/components/primitives/product-icon';
import {Rating} from '../../common/ui/components/primitives/rating';
import {TooltipDate} from '../../common/ui/components/primitives/tooltip-date';
import {OverviewTab} from '../../common/ui/components/tabs/overview-tab';
import {ReviewsTab} from '../../common/ui/components/tabs/reviews-tab';
import {SupportTab} from '../../common/ui/components/tabs/support-tab';
import {VersionsTab} from '../../common/ui/components/tabs/versions-tab';
import {ensureAuth} from '../../common/utils/auth-helper';
import {isPaid} from '../../common/utils/price';
import {
  productPageParamsSchema,
  productSearchParamsSchema,
} from '../../common/utils/validators';

export default async function ProductPage(props: {
  params: Promise<{tenant: string; workspace: string; slug: string}>;
  searchParams: Promise<{
    tab?: string;
    reviewPage?: string;
    versionPage?: string;
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

  const product = await findProduct({
    slug: params.slug,
    client,
    workspace: auth.workspace,
    mainPartnerId: auth.user?.mainPartnerId,
  });

  if (!product) notFound();

  const {tab, reviewPage, versionPage} = searchParams;

  const bgGradient =
    GRADIENT_MAP[product.marketplaceCoverStyle || 'gradient-1'] ||
    DEFAULT_GRADIENT;

  const rating = Number(product.averageRating || 0);
  const ratingCount = Number(product.ratingCount || 0);
  const categoryName = product.productCategory?.name ?? null;
  const isApp = product.marketplaceTypeSelect === MARKETPLACE_TYPE.APP;
  const hubSegment = isApp
    ? MARKETPLACE_TYPE_SEGMENT.APPS
    : MARKETPLACE_TYPE_SEGMENT.SKILLS;
  const hubLabel = isApp ? await t('Apps Studio') : await t('Skills Hub');

  const tabNavLink = (tab: string) =>
    `${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=${tab}`;

  const installCountLabel = await t(
    '{0} installs',
    await formatNumber(product.installCount || 0),
  );

  // Server-computed ATI (and WT) come pre-baked on the product row.
  const priceScale = product.saleCurrency?.numberOfDecimals ?? 2;
  const {ati: priceAti} = product.price;
  const paid = isPaid(priceAti);

  /* CTA gating. Free products keep the existing public Download button.
   * For paid products:
   *   - product owner (the supplier partner that created it) → Download
   *   - buyer with a purchase row → Download
   *   - logged-in non-owner non-buyer → Add to cart + Buy now
   *   - guest → "Sign in to buy" link
   * Owner can also pull drafts; the download gate honours both branches. */
  const mainPartnerId = auth.user?.mainPartnerId;
  const isOwner =
    !!mainPartnerId && product.defaultSupplierPartner?.id === mainPartnerId;
  const owns = !!(
    paid &&
    mainPartnerId &&
    (await client.aOSMarketplaceProductPurchase.findOne({
      where: {
        partner: {id: mainPartnerId},
        product: {id: product.id},
      },
      select: {id: true},
    }))
  );
  const canDownload = !paid || isOwner || owns;
  const priceBadgeLabel = paid
    ? await formatNumber(priceAti, {
        type: 'DECIMAL',
        scale: priceScale,
        currency: product.saleCurrency?.symbol ?? undefined,
      })
    : await t('Free');

  const [
    byLabel,
    updatedLabel,
    downloadZipLabel,
    documentationLabel,
    overviewLabel,
    versionsLabel,
    reviewsLabel,
    supportLabel,
    detailsLabel,
    versionLabel,
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
    t('by'),
    t('Updated'),
    t('Download ZIP'),
    t('Documentation'),
    t('Overview'),
    t('Versions'),
    t('Reviews ({0})', String(ratingCount)),
    t('Support'),
    t('Details'),
    t('Version'),
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

  return (
    <div className="min-h-screen">
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
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[120px_1fr_240px] gap-6 md:gap-8">
            {/* Left: Icon */}
            <div className="flex items-center justify-center">
              <div
                className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${bgGradient} flex items-center justify-center`}>
                <ProductIcon
                  code={product.marketplaceIconCode}
                  className="w-16 h-16"
                />
              </div>
            </div>

            {/* Center: Info */}
            <div className="space-y-4">
              {/* Category and Status */}
              <div className="flex items-center gap-2 flex-wrap">
                {categoryName && (
                  <Badge variant="outline">{categoryName}</Badge>
                )}
                <Badge variant={paid ? 'outline' : 'success'}>
                  {priceBadgeLabel}
                </Badge>
                {product.currentVersion && (
                  <Badge variant="outline">
                    {formatVersionNumber(product.currentVersion)}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {product.name}
              </h1>

              {/* Description */}
              <InnerHTML
                content={product.description || undefined}
                as="p"
                className="text-muted-foreground leading-relaxed text-sm"
              />

              {/* Creator, Rating, Stats */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{byLabel}</span>
                  <span className="font-semibold text-foreground">
                    {product.defaultSupplierPartner?.simpleFullName ||
                      product.defaultSupplierPartner?.name ||
                      ''}
                  </span>
                </div>

                {/* Rating */}
                <Rating
                  value={rating}
                  formattedValue={await formatNumber(rating, {
                    type: 'DECIMAL',
                    scale: 1,
                  })}
                  count={ratingCount}
                  size={16}
                  valueClassName="font-semibold text-foreground"
                />

                {/* Installs */}
                <div className="flex items-center gap-1">
                  <Download size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {installCountLabel}
                  </span>
                </div>

                {/* Updated */}
                {product.currentVersion?.dateOfPublish && (
                  <TooltipDate
                    date={product.currentVersion.dateOfPublish}
                    displayType="relative"
                    prefix={updatedLabel}
                    lowercase
                  />
                )}
              </div>
            </div>

            {/* Right: Buttons and Links */}
            <div className="flex flex-col gap-3 justify-center">
              {canDownload ? (
                <Button
                  size="lg"
                  className="gap-2 rounded-full"
                  asChild
                  disabled={!product.currentVersion?.id}>
                  <a
                    href={
                      product.currentVersion?.id
                        ? `${workspaceURI}/${SUBAPP_CODES.marketplace}/api/products/${product.id}/versions/${product.currentVersion.id}/download`
                        : '#'
                    }
                    download>
                    <Download size={18} />
                    {downloadZipLabel}
                  </a>
                </Button>
              ) : !auth.user ? (
                <Button size="lg" className="gap-2 rounded-full" asChild>
                  <Link
                    href={getLoginURL({
                      callbackurl: `${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}`,
                      workspaceURI,
                      tenant: tenantId,
                    })}>
                    {await t('Sign in to buy')}
                  </Link>
                </Button>
              ) : (
                <BuyButtons
                  productId={product.id}
                  productSlug={product.slug ?? ''}
                  name={product.name ?? ''}
                  priceAti={priceAti}
                  currencySymbol={product.saleCurrency?.symbol ?? null}
                  scale={priceScale}
                  description={product.description ?? null}
                  marketplaceIconCode={product.marketplaceIconCode ?? null}
                  marketplaceCoverStyle={product.marketplaceCoverStyle ?? null}
                  currentVersionNumber={
                    product.currentVersion
                      ? formatVersionNumber(product.currentVersion)
                      : null
                  }
                  cartHref={`${workspaceURI}/${SUBAPP_CODES.marketplace}/cart`}
                  addToCartLabel={await t('Add to cart')}
                  buyNowLabel={await t('Buy now')}
                  inCartLabel={await t('In cart — view cart')}
                />
              )}

              <Suspense
                fallback={
                  <div className="h-11 rounded-full bg-muted animate-pulse" />
                }>
                <FavoriteButton
                  productId={product.id}
                  workspaceURL={workspaceURL}
                  workspaceURI={workspaceURI}
                  userId={auth.user?.id}
                  client={client}
                />
              </Suspense>

              {product.documentationUrl && (
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="gap-2 rounded-full">
                  <Link
                    href={product.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer">
                    <FileText size={18} />
                    {documentationLabel}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
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
              <VersionCountBadge slug={params.slug} client={client} />
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
                loginHref={getLoginURL({
                  callbackurl: `${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=reviews`,
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

async function FavoriteButton({
  productId,
  workspaceURL,
  workspaceURI,
  userId,
  client,
}: {
  productId: ID;
  workspaceURL: string;
  workspaceURI: string;
  userId?: ID;
  client: Client;
}) {
  const isFavorited = userId
    ? await isProductFavorited({
        userId,
        productId,
        client,
      })
    : false;

  return (
    <AddToFavoriteButton
      productId={productId}
      workspaceURL={workspaceURL}
      workspaceURI={workspaceURI}
      isFavorite={isFavorited}
    />
  );
}

async function VersionCountBadge({
  slug,
  client,
}: {
  slug: string;
  client: Client;
}) {
  const versionCount = await client.aOSMarketplaceProductVersion.count({
    where: {
      product: {slug},
      statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
    },
  });

  return <>{versionCount}</>;
}
