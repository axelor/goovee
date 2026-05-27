import {SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {t} from '@/locale/server';
import {formatNumber} from '@/locale/server/formatters';
import type {ID} from '@/types';
import {Badge, Button} from '@/ui/components';
import {InnerHTML} from '@/ui/components/inner-html';
import {getLoginURL} from '@/utils/url';
import {Download, FileText} from 'lucide-react';
import Link from 'next/link';
import {Suspense} from 'react';
import {DEFAULT_GRADIENT, GRADIENT_MAP} from '../../../../constants/gradients';
import type {SingleProduct} from '../../../../orm';
import {isProductFavorited} from '../../../../orm';
import {formatVersionNumber} from '../../../../utils/version-number';
import {AddToFavoriteButton} from '../../buttons/add-to-favorite-button';
import {BuyButtons} from '../../buttons/buy-buttons';
import {ProductIcon} from '../../primitives/product-icon';
import {Rating} from '../../primitives/rating';
import {TooltipDate} from '../../primitives/tooltip-date';

export interface ProductHeaderCardProps {
  product: SingleProduct;
  client: Client;
  user?: {id: ID; mainPartnerId?: ID};
  workspaceURL: string;
  workspaceURI: string;
  tenantId: string;
}

export async function ProductHeaderCard({
  product,
  client,
  user,
  workspaceURL,
  workspaceURI,
  tenantId,
}: ProductHeaderCardProps) {
  const bgGradient =
    GRADIENT_MAP[product.marketplaceCoverStyle || 'gradient-1'] ||
    DEFAULT_GRADIENT;

  const rating = Number(product.averageRating || 0);
  const ratingCount = Number(product.ratingCount || 0);
  const categoryName = product.productCategory?.name ?? null;

  const priceScale = product.saleCurrency?.numberOfDecimals ?? 2;
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

  const priceBadgeLabel = paid
    ? await formatNumber(priceAti, {
        type: 'DECIMAL',
        scale: priceScale,
        currency: product.saleCurrency?.symbol ?? undefined,
      })
    : priceFreeLabel;

  const installCountLabel = await t(
    '{0} installs',
    await formatNumber(product.installCount || 0),
  );

  return (
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
            {categoryName && <Badge variant="outline">{categoryName}</Badge>}
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

        {/* Right: Buttons and Links */}
        <div className="flex flex-col gap-3 justify-center">
          <CTAButton
            product={product}
            user={user}
            client={client}
            workspaceURI={workspaceURI}
            tenantId={tenantId}
            paid={paid}
            priceAti={priceAti}
            priceScale={priceScale}
            downloadZipLabel={downloadZipLabel}
          />

          <Suspense
            fallback={
              <div className="h-11 rounded-full bg-muted animate-pulse" />
            }>
            <FavoriteButton
              productId={product.id}
              workspaceURL={workspaceURL}
              workspaceURI={workspaceURI}
              userId={user?.id}
              client={client}
            />
          </Suspense>

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
  client,
  workspaceURI,
  tenantId,
  paid,
  priceAti,
  priceScale,
  downloadZipLabel,
}: {
  product: SingleProduct;
  user?: {id: ID; mainPartnerId?: ID};
  client: Client;
  workspaceURI: string;
  tenantId: string;
  paid: boolean;
  priceAti: number;
  priceScale: number;
  downloadZipLabel: string;
}) {
  const mainPartnerId = user?.mainPartnerId;
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
