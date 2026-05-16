import Link from 'next/link';
import {Suspense} from 'react';
import {Download, FileText} from 'lucide-react';
import {notFound} from 'next/navigation';
import {SUBAPP_CODES} from '@/constants';
import {formatNumber} from '@/locale/server/formatters';
import {t} from '@/locale/server';
import {workspacePathname} from '@/utils/workspace';
import {cn} from '@/utils/css';
import {Badge, Button} from '@/ui/components';
import {InnerHTML} from '@/ui/components/inner-html';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components/breadcrumb';
import {Avatar, AvatarImage} from '@/ui/components/avatar';
import {NO_IMAGE_URL} from '@/constants';

import {findProduct, isProductFavorited} from '../../common/orm/orm';
import {GRADIENT_MAP, DEFAULT_GRADIENT} from '../../common/constant/gradients';
import {MARKETPLACE_VERSION_STATUS} from '../../common/constant/statuses';
import {ProductTab} from '../../common/constant/tabs';
import {ProductIcon} from '../../common/ui/components/product-icon';
import {Rating} from '../../common/ui/components/rating';
import {ensureAuth} from '../../common/utils/auth-helper';
import {OverviewTab} from '../../common/ui/components/overview-tab';
import {VersionsTab} from '../../common/ui/components/versions-tab';
import {ReviewsTab} from '../../common/ui/components/reviews-tab';
import {SupportTab} from '../../common/ui/components/support-tab';
import {AddToFavoriteButton} from '../../common/ui/components/add-to-favorite-button';
import {ClientDate} from '../../common/ui/components/client-date';
import type {Client} from '@/goovee/.generated/client';
import type {ID} from '@/types';

export default async function ProductPage(props: {
  params: Promise<{tenant: string; workspace: string; slug: string}>;
  searchParams: Promise<{
    tab?: string;
    reviewPage?: string;
    versionPage?: string;
  }>;
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

  const {error, auth} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: true,
  });
  if (error) notFound();

  const client = auth.tenant.client;

  const product = await findProduct({
    slug: params.slug,
    client,
    workspace: auth.workspace,
  });

  if (!product) notFound();

  const currentTab = (searchParams.tab || ProductTab.Overview) as ProductTab;

  const reviewPage = searchParams.reviewPage
    ? parseInt(searchParams.reviewPage)
    : 1;
  const versionPage = searchParams.versionPage
    ? parseInt(searchParams.versionPage)
    : 1;

  const bgGradient =
    GRADIENT_MAP[product.marketplaceCoverStyle || 'gradient-1'] ||
    DEFAULT_GRADIENT;

  const rating = Number(product.averageRating || 0);
  const ratingCount = Number(product.ratingCount || 0);
  const categoryName = product.productCategory?.name || 'Skills';

  const tabNavLink = (tab: string) =>
    `${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=${tab}`;

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
                <Link href={`${workspaceURI}/${SUBAPP_CODES.marketplace}`}>
                  {await t('Skills Hub')}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-foreground-muted cursor-pointer truncate text-md">
                <Link
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}?category=${product.productCategory?.id}`}>
                  {categoryName}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
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
                <Badge variant="outline">{categoryName}</Badge>
                <Badge variant="success">Free · Open source</Badge>
                {product.currentVersion?.versionNumber && (
                  <Badge variant="outline">
                    {product.currentVersion.versionNumber}
                  </Badge>
                )}
                {product.currentVersion?.compatibilitySet &&
                  product.currentVersion.compatibilitySet.length > 0 && (
                    <>
                      {product.currentVersion.compatibilitySet.map(version => (
                        <Badge key={version.id} variant="outline">
                          {version.title}
                        </Badge>
                      ))}
                    </>
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
                  <span className="text-muted-foreground">by</span>
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
                    {formatNumber(product.installCount || 0)} installs
                  </span>
                </div>

                {/* Updated */}
                {product.currentVersion?.dateOfApproval && (
                  <ClientDate
                    date={product.currentVersion.dateOfApproval}
                    displayType="relative"
                    prefix="Updated"
                    lowercase
                  />
                )}
              </div>
            </div>

            {/* Right: Buttons and Links */}
            <div className="flex flex-col gap-3 justify-center">
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
                  Download ZIP
                </a>
              </Button>

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
                    Documentation
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
              currentTab === ProductTab.Overview
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}>
            Overview
          </Link>
          <Link
            href={tabNavLink(ProductTab.Versions)}
            className={cn(
              'px-6 pt-4 pb-3 font-medium transition-colors border-b-2',
              currentTab === ProductTab.Versions
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}>
            Versions (
            <Suspense fallback="...">
              <VersionCountBadge slug={params.slug} client={client} />
            </Suspense>
            )
          </Link>
          <Link
            href={tabNavLink(ProductTab.Reviews)}
            className={cn(
              'px-6 pt-4 pb-3 font-medium transition-colors border-b-2',
              currentTab === ProductTab.Reviews
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}>
            Reviews ({ratingCount})
          </Link>
          <Link
            href={tabNavLink(ProductTab.Support)}
            className={cn(
              'px-6 pt-4 pb-3 font-medium transition-colors border-b-2',
              currentTab === ProductTab.Support
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}>
            Support
          </Link>
        </div>
      </div>

      {/* Content with Static Sidebar */}
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Changes with tabs */}
          <div className="lg:col-span-2">
            {currentTab === ProductTab.Overview && (
              <OverviewTab product={product} tenantId={tenantId} />
            )}
            {currentTab === ProductTab.Versions && (
              <VersionsTab
                product={product}
                workspaceURI={workspaceURI}
                client={client}
                versionPage={versionPage}
                currentVersionId={product.currentVersion?.id}
              />
            )}
            {currentTab === ProductTab.Reviews && (
              <ReviewsTab
                product={product}
                workspaceURI={workspaceURI}
                tenantId={tenantId}
                client={client}
                reviewPage={reviewPage}
              />
            )}
            {currentTab === ProductTab.Support && (
              <SupportTab product={product} />
            )}
          </div>

          {/* Static Sidebar - Always Visible */}
          <div className="space-y-6">
            {/* Details Card */}
            <div className="bg-card rounded-lg border border-border p-4 md:p-8 space-y-6">
              <h3 className="text-lg font-bold text-foreground">Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="font-semibold text-foreground">
                    {product.currentVersion?.versionNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Updated</span>
                  {product.currentVersion?.dateOfApproval ? (
                    <ClientDate
                      date={product.currentVersion.dateOfApproval}
                      displayType="relative"
                      showTooltip={true}
                      className="font-semibold text-foreground"
                    />
                  ) : (
                    <span className="font-semibold text-foreground">N/A</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Published
                  </span>
                  {product.createdOn ? (
                    <ClientDate
                      date={product.createdOn}
                      displayType="simple"
                      format="MMM YYYY"
                      className="font-semibold text-foreground"
                    />
                  ) : (
                    <span className="font-semibold text-foreground">N/A</span>
                  )}
                </div>
                {product.currentVersion?.bundleFile?.sizeText && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Size</span>
                    <span className="font-semibold text-foreground">
                      {product.currentVersion.bundleFile.sizeText}
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground block mb-2">
                    Compatibility
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
                      No compatible versions specified
                    </p>
                  )}
                </div>
                <div className="border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">
                    Category
                  </span>
                  <p className="font-semibold text-foreground">
                    {categoryName}
                  </p>
                </div>
                <div className="border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">License</span>
                  <p className="font-semibold text-foreground">MIT</p>
                </div>
              </div>
            </div>

            {/* About Author Card */}
            {product.defaultSupplierPartner && (
              <div className="bg-card rounded-lg border border-border p-4 md:p-8 space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  About the author
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
                        'Author'
                      }
                      size={48}
                    />
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {product.defaultSupplierPartner.simpleFullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Verified contributor
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full rounded-full">
                  View profile
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
