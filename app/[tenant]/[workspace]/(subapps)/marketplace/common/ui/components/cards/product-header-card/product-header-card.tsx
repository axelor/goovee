import {SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {t, tattr} from '@/locale/server';
import {formatNumber} from '@/locale/server/formatters';
import type {ID} from '@/types';
import {Badge, Button} from '@/ui/components';
import {InnerHTML} from '@/ui/components/inner-html';
import {cn} from '@/utils/css';
import {getLoginURL} from '@/utils/url';
import {Download, FileText, Heart} from 'lucide-react';
import Link from 'next/link';
import {Suspense} from 'react';
import {DEFAULT_GRADIENT, GRADIENT_MAP} from '../../../../constants/gradients';
import type {SingleProduct} from '../../../../orm';
import {isProductFavorited} from '../../../../orm';
import {formatVersionNumber} from '../../../../utils/version-number';
import {AddToFavoriteButton} from '../../buttons/add-to-favorite-button';
import {BuyButtons} from '../../buttons/buy-buttons';
import {ProductIcon} from '../../primitives/product-icon';
import {ProductTypeBadge} from '../../primitives/product-type-badge';
import {Rating} from '../../primitives/rating';
import {TooltipDate} from '../../primitives/tooltip-date';

export interface ProductHeaderCardProps {
  product: SingleProduct;
  client: Client;
  user?: {id: ID; mainPartnerId?: ID};
  workspaceURL: string;
  workspaceURI: string;
  tenantId: string;
  /** Owner preview: render the buyer's CTA but inactive (no cart/checkout). */
  preview?: boolean;
  canDownloadPromise: Promise<boolean>;
}

export async function ProductHeaderCard({
  product,
  client,
  user,
  workspaceURL,
  workspaceURI,
  tenantId,
  preview = false,
  canDownloadPromise,
}: ProductHeaderCardProps) {
  const bgGradient =
    GRADIENT_MAP[product.coverStyle || 'gradient-1'] || DEFAULT_GRADIENT;

  const rating = Number(product.averageRating || 0);
  const ratingCount = Number(product.ratingCount || 0);
  const categories = (product.categorySet ?? []).filter(c => !!c?.id);
  const marketplaceHref = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;

  const priceScale = product.price.currency.numberOfDecimals;
  const {ati: priceAti} = product.price;
  const paid = priceAti > 0;

  const [
    byLabel,
    updatedLabel,
    downloadZipLabel,
    documentationLabel,
    priceFreeLabel,
  ] = await Promise.all([
    t('by'),
    t('Updated'),
    t('Download ZIP'),
    t('Documentation'),
    t('Free'),
  ]);

  const typeLabel = product.marketplaceTypeSelect
    ? await tattr(product.marketplaceTypeSelect)
    : undefined;

  const priceBadgeLabel = paid
    ? await formatNumber(priceAti, {
        type: 'DECIMAL',
        scale: priceScale,
        currency: product.price.currency.code,
      })
    : priceFreeLabel;

  const installCountLabel = await t(
    '{0} installs',
    await formatNumber(product.installCount || 0),
  );

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-8 relative">
      {/* Favorite — pinned top-right */}
      <div className="absolute top-4 right-4 z-10">
        {preview ? (
          <Button
            variant="outline"
            size="icon"
            disabled
            title={await t('Inactive in preview')}
            aria-label={await t('Add to favorites')}
            className="rounded-full bg-card/90 backdrop-blur-sm shadow-sm">
            <Heart size={18} className="shrink-0" />
          </Button>
        ) : (
          <Suspense
            fallback={
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            }>
            <FavoriteButton
              productId={product.id}
              workspaceURL={workspaceURL}
              workspaceURI={workspaceURI}
              userId={user?.id}
              client={client}
            />
          </Suspense>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[120px_1fr_240px] gap-6 md:gap-8">
        {/* Left: Icon */}
        <div className="flex items-center justify-center">
          <div
            className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${bgGradient} flex items-center justify-center`}>
            <ProductIcon code={product.iconCode} className="w-16 h-16" />
          </div>
        </div>

        {/* Center: Info */}
        <div className="space-y-4">
          {/* Category and Status */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.marketplaceTypeSelect && typeLabel && (
              <ProductTypeBadge
                type={product.marketplaceTypeSelect}
                label={typeLabel}
              />
            )}
            {/* Each category badge acts like a breadcrumb-style filter
                link back to the marketplace listing. */}
            {categories.map(c => (
              <Link key={c.id} href={`${marketplaceHref}?category=${c.id}`}>
                <Badge
                  variant="outline"
                  className="hover:bg-muted cursor-pointer">
                  {c.name}
                </Badge>
              </Link>
            ))}
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
                {product.publisher?.simpleFullName ||
                  product.publisher?.name ||
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
              <span className="text-muted-foreground">{installCountLabel}</span>
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

        {/* Right: Price + Buttons */}
        <div className="flex flex-col gap-3 justify-center">
          <div
            className={cn(
              'text-4xl font-bold text-right lg:pr-12',
              paid ? 'text-foreground' : 'text-success',
            )}>
            {priceBadgeLabel}
          </div>

          <CTAButton
            product={product}
            user={user}
            workspaceURI={workspaceURI}
            tenantId={tenantId}
            paid={paid}
            priceAti={priceAti}
            priceScale={priceScale}
            downloadZipLabel={downloadZipLabel}
            preview={preview}
            canDownloadPromise={canDownloadPromise}
          />

          {product.documentationUrl && (
            <DocumentationButton
              url={product.documentationUrl}
              label={documentationLabel}
            />
          )}
        </div>
      </div>
    </div>
  );
}

async function CTAButton({
  product,
  user,
  workspaceURI,
  tenantId,
  paid,
  priceAti,
  priceScale,
  downloadZipLabel,
  preview,
  canDownloadPromise,
}: {
  product: SingleProduct;
  user?: {id: ID; mainPartnerId?: ID};
  workspaceURI: string;
  tenantId: string;
  paid: boolean;
  priceAti: number;
  priceScale: number;
  downloadZipLabel: string;
  preview: boolean;
  canDownloadPromise: Promise<boolean>;
}) {
  // Preview: show the buyer's CTA exactly as a shopper would see it, but
  // inert — no cart writes, no checkout, no draft-bundle download.
  if (preview) {
    return paid ? (
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          className="gap-2 rounded-full"
          disabled
          title={await t('Inactive in preview')}>
          {await t('Buy now')}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="gap-2 rounded-full"
          disabled
          title={await t('Inactive in preview')}>
          {await t('Add to cart')}
        </Button>
      </div>
    ) : (
      <Button
        size="lg"
        className="gap-2 rounded-full"
        disabled
        title={await t('Inactive in preview')}>
        <Download size={18} />
        {downloadZipLabel}
      </Button>
    );
  }

  const canDownload = await canDownloadPromise;

  if (canDownload) {
    return (
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
    );
  }

  if (!user) {
    return (
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
    );
  }

  return (
    <BuyButtons
      productId={product.id}
      productSlug={product.slug ?? ''}
      name={product.name ?? ''}
      priceAti={priceAti}
      currencySymbol={product.price.currency.symbol}
      scale={priceScale}
      description={product.description ?? null}
      iconCode={product.iconCode ?? null}
      coverStyle={product.coverStyle ?? null}
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
  );
}

function DocumentationButton({url, label}: {url: string; label: string}) {
  return (
    <Button asChild variant="ghost" size="lg" className="gap-2 rounded-full">
      <Link href={url} target="_blank" rel="noopener noreferrer">
        <FileText size={18} />
        {label}
      </Link>
    </Button>
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
