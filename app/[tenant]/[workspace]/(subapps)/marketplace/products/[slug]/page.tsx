import Link from 'next/link';
import {Star, Download, FileText, Heart} from 'lucide-react';
import {notFound} from 'next/navigation';
import {SUBAPP_CODES} from '@/constants';
import {formatNumber} from '@/locale/server/formatters';
import {t} from '@/locale/server';
import {workspacePathname} from '@/utils/workspace';
import {cn} from '@/utils/css';
import {Badge, Button} from '@/ui/components';
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

import {findProduct} from '../../common/orm/orm';
import {GRADIENT_MAP, DEFAULT_GRADIENT} from '../../common/constant/gradients';
import {MARKETPLACE_VERSION_STATUS} from '../../common/constant/statuses';
import {ProductIcon} from '../../common/ui/components/product-icon';
import {ensureAuth} from '../../common/utils/auth-helper';
import {OverviewTab} from './components/overview-tab';
import {VersionsTab} from './components/versions-tab';
import {ReviewsTab} from './components/reviews-tab';
import {SupportTab} from './components/support-tab';

export default async function ProductPage(props: {
  params: Promise<{tenant: string; workspace: string; slug: string}>;
  searchParams: Promise<{tab?: string; reviewPage?: string; versionPage?: string}>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const {error, auth, forceLogin} = await ensureAuth(workspaceURL, tenant, {
    allowGuest: true,
  });
  if (error || forceLogin) notFound();

  const client = auth.tenant.client;

  const [product, versionCount] = await Promise.all([
    findProduct(params.slug, client),
    client.aOSMarketplaceProductVersion.count({
      where: {
        product: {slug: params.slug},
        statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
      },
    }),
  ]);

  if (!product) notFound();

  const currentTab = (searchParams.tab || 'overview') as
    | 'overview'
    | 'versions'
    | 'reviews'
    | 'support';

  const reviewPage = searchParams.reviewPage ? parseInt(searchParams.reviewPage as string) : 1;
  const versionPage = searchParams.versionPage ? parseInt(searchParams.versionPage as string) : 1;

  const bgGradient =
    GRADIENT_MAP[product.marketplaceCoverStyle || 'gradient-1'] || DEFAULT_GRADIENT;

  const rating = Number(product.averageRating || 0);
  const ratingCount = Number(product.ratingCount || 0);
  const categoryName = product.productCategory?.name || 'Skills';

  const tabNavLink = (tab: string) =>
    `${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=${tab}`;

  return (
    <div className="min-h-screen bg-background">
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
        <div className="bg-card rounded-2xl border border-border p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left: Icon */}
            <div className="flex items-center justify-center">
              <div
                className={`w-40 h-40 rounded-2xl bg-gradient-to-br ${bgGradient} flex items-center justify-center`}>
                <ProductIcon code={product.marketplaceIconCode} className="w-24 h-24" />
              </div>
            </div>

            {/* Center: Info */}
            <div className="space-y-4">
              {/* Category and Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{categoryName}</Badge>
                <Badge variant="success">Free · Open source</Badge>
                {product.currentVersion?.versionNumber && (
                  <Badge variant="outline">{product.currentVersion.versionNumber}</Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed text-sm">
                {product.description}
              </p>

              {/* Creator, Rating, Stats */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">by</span>
                  <span className="font-semibold text-foreground">Axelor Labs</span>
                </div>

                <div className="flex items-center gap-4 text-sm flex-wrap">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={
                            i < Math.round(rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-gray-200 text-gray-200'
                          }
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-foreground">
                      {rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>

                  {/* Installs */}
                  <div className="flex items-center gap-1">
                    <Download size={16} className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatNumber(product.installCount || 0)} installs
                    </span>
                  </div>

                  {/* Updated */}
                  <span className="text-muted-foreground">Updated 12 days ago</span>
                </div>
              </div>
            </div>

            {/* Right: Buttons and Links */}
            <div className="flex flex-col gap-3 justify-center">
              <Button size="lg" className="gap-2 rounded-full">
                <Download size={18} />
                Download ZIP
              </Button>

              <Button variant="outline" size="lg" className="gap-2 rounded-full">
                <Heart size={18} />
                Add to favorites
              </Button>

              {product.documentationUrl && (
                <Button asChild variant="ghost" size="lg" className="gap-2 rounded-full">
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
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="container flex gap-8">
          <Link
            href={tabNavLink('overview')}
            className={cn(
              'py-4 font-medium transition-colors border-b-2 -mb-px',
              currentTab === 'overview'
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            )}>
            Overview
          </Link>
          <Link
            href={tabNavLink('versions')}
            className={cn(
              'py-4 font-medium transition-colors border-b-2 -mb-px',
              currentTab === 'versions'
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            )}>
            Versions ({versionCount})
          </Link>
          <Link
            href={tabNavLink('reviews')}
            className={cn(
              'py-4 font-medium transition-colors border-b-2 -mb-px',
              currentTab === 'reviews'
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            )}>
            Reviews ({ratingCount})
          </Link>
          <Link
            href={tabNavLink('support')}
            className={cn(
              'py-4 font-medium transition-colors border-b-2 -mb-px',
              currentTab === 'support'
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
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
            {currentTab === 'overview' && <OverviewTab product={product} />}
            {currentTab === 'versions' && (
              <VersionsTab
                product={product}
                workspaceURI={workspaceURI}
                client={client}
                versionPage={versionPage}
                currentVersionId={product.currentVersion?.id}
              />
            )}
            {currentTab === 'reviews' && (
              <ReviewsTab
                product={product}
                workspaceURI={workspaceURI}
                tenant={tenant}
                client={client}
                reviewPage={reviewPage}
              />
            )}
            {currentTab === 'support' && <SupportTab product={product} />}
          </div>

          {/* Static Sidebar - Always Visible */}
          <div className="space-y-6">
            {/* Details Card */}
            <div className="bg-card rounded-lg border border-border p-8 space-y-6">
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
                  <span className="font-semibold text-foreground">12 days ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Published</span>
                  <span className="font-semibold text-foreground">Mar 2025</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Size</span>
                  <span className="font-semibold text-foreground">1.2 MB</span>
                </div>
                <div className="border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground block mb-2">
                    Compatibility
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-block px-2 py-1 bg-muted rounded text-xs text-foreground">
                      Axelor 7.4
                    </span>
                    <span className="inline-block px-2 py-1 bg-muted rounded text-xs text-foreground">
                      Axelor 7.3
                    </span>
                    <span className="inline-block px-2 py-1 bg-muted rounded text-xs text-foreground">
                      Axelor 7.2
                    </span>
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <p className="font-semibold text-foreground">{categoryName}</p>
                </div>
                <div className="border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">License</span>
                  <p className="font-semibold text-foreground">MIT</p>
                </div>
              </div>
            </div>

            {/* Support Links Card */}
            {(product.documentationUrl ||
              product.supportIssuesUrl ||
              product.supportContactUrl) && (
              <div className="bg-card rounded-lg border border-border p-8 space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  Support & Resources
                </h3>
                <div className="space-y-3">
                  {product.documentationUrl && (
                    <a
                      href={product.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group">
                      <FileText
                        size={20}
                        className="text-muted-foreground group-hover:text-foreground flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          Documentation
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Read guides and API docs
                        </p>
                      </div>
                    </a>
                  )}

                  {product.supportIssuesUrl && (
                    <a
                      href={product.supportIssuesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group">
                      <FileText
                        size={20}
                        className="text-muted-foreground group-hover:text-foreground flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Issues</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Report bugs and request features
                        </p>
                      </div>
                    </a>
                  )}

                  {product.supportContactUrl && (
                    <a
                      href={product.supportContactUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group">
                      <FileText
                        size={20}
                        className="text-muted-foreground group-hover:text-foreground flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Contact</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Get in touch for support
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* About Author Card */}
            {product.defaultSupplierPartner && (
              <div className="bg-card rounded-lg border border-border p-8 space-y-4">
                <h3 className="text-lg font-bold text-foreground">About the author</h3>
                <div className="flex items-start gap-4">
                  <Avatar className="rounded-full h-12 w-12 flex-shrink-0">
                    <AvatarImage
                      src={
                        product.defaultSupplierPartner.picture?.id
                          ? `/api/tenant/${tenant}/partner/image/${product.defaultSupplierPartner.picture.id}`
                          : NO_IMAGE_URL
                      }
                      alt={product.defaultSupplierPartner.simpleFullName || 'Author'}
                    />
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {product.defaultSupplierPartner.simpleFullName}
                    </p>
                    <p className="text-xs text-muted-foreground">Verified contributor</p>
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
