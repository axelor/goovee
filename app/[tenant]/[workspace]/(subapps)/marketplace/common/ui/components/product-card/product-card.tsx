import Link from 'next/link';
import {Star, Download} from 'lucide-react';
import {SUBAPP_CODES} from '@/constants';
import {formatNumber} from '@/locale/server/formatters';
import {InnerHTML} from '@/ui/components/inner-html';
import type {ListProduct} from '../../../orm/orm';
import {GRADIENT_MAP, DEFAULT_GRADIENT} from '../../../constant/gradients';
import {ProductIcon} from '../product-icon';

export interface ProductCardProps {
  product: ListProduct;
  workspaceURI: string;
}

export function ProductCard({product, workspaceURI}: ProductCardProps) {
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

  const bgGradient =
    GRADIENT_MAP[marketplaceCoverStyle || 'gradient-1'] || DEFAULT_GRADIENT;

  return (
    <Link href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${slug}`}>
      <div className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow flex flex-col h-full">
        {/* Header with gradient and icon */}
        <div
          className={`h-[140px] bg-gradient-to-br ${bgGradient} flex items-center justify-center relative`}>
          <ProductIcon code={marketplaceIconCode} className="w-16 h-16" />
          <div className="absolute top-3 right-3 bg-success-light px-2.5 py-1 rounded-full">
            <span className="text-xs font-medium text-success">Free</span>
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
            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => {
                  const rating = Number(averageRating || 0);
                  return (
                    <Star
                      key={i}
                      size={12}
                      className={
                        i < Math.round(rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-gray-200 text-gray-200'
                      }
                    />
                  );
                })}
              </div>
              <span className="text-xs text-muted-foreground ml-1">
                {Number(averageRating || 0).toFixed(1)}
              </span>
            </div>

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
