import Link from 'next/link';
import {Download} from 'lucide-react';
import {Rating} from '../rating';
import {SUBAPP_CODES} from '@/constants';
import {formatNumber} from '@/locale/server/formatters';
import {InnerHTML} from '@/ui/components/inner-html';
import type {ListProduct} from '../../../orm/orm';
import {isPaid} from '../../../utils/price';
import {GRADIENT_MAP, DEFAULT_GRADIENT} from '../../../constants/gradients';
import {ProductIcon} from '../product-icon';
import {t} from '@/locale/server';

export interface ProductCardProps {
  product: ListProduct;
  workspaceURI: string;
}

export async function ProductCard({product, workspaceURI}: ProductCardProps) {
  const freeLabel = await t('Free');
  const {
    slug,
    name,
    description,
    currentVersion,
    averageRating = 0,
    installCount = 0,
    marketplaceIconCode,
    marketplaceCoverStyle,
  } = product;

  // Server-computed ATI (and WT) come pre-baked on the product row.
  const {ati: priceAti, currency} = product.price;
  const paid = isPaid(priceAti);
  const priceLabel = paid
    ? await formatNumber(priceAti, {
        type: 'DECIMAL',
        scale: product.saleCurrency?.numberOfDecimals ?? 2,
        currency: currency.symbol || undefined,
      })
    : freeLabel;

  const bgGradient =
    GRADIENT_MAP[marketplaceCoverStyle || 'gradient-1'] || DEFAULT_GRADIENT;

  return (
    <Link href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${slug}`}>
      <div className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow flex flex-col h-full">
        {/* Header with gradient and icon */}
        <div
          className={`h-[140px] bg-gradient-to-br ${bgGradient} flex items-center justify-center relative`}>
          <ProductIcon code={marketplaceIconCode} className="w-16 h-16" />
          <div
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-full ${paid ? 'bg-primary/10' : 'bg-success-light'}`}>
            <span
              className={`text-xs font-medium ${paid ? 'text-primary' : 'text-success'}`}>
              {priceLabel}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col justify-between flex-1">
          {/* Title and version */}
          <div className="pb-1.5">
            <div className="flex items-start justify-between mb-1.5 gap-2">
              <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                {name}
              </h3>
              {currentVersion?.versionNumber && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {currentVersion.versionNumber}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="pb-3 flex-grow">
            <InnerHTML
              content={description || undefined}
              as="p"
              className="text-xs text-muted-foreground line-clamp-2"
            />
          </div>

          {/* Footer with rating and download count */}
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <Rating
              value={averageRating}
              size={12}
              valueClassName="text-xs text-muted-foreground"
            />

            {/* Download count */}
            <div className="flex items-center gap-1">
              <Download size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatNumber(installCount || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
