import Link from 'next/link';
import {MdDownload} from 'react-icons/md';
import {HiOutlineUser} from 'react-icons/hi';

import {t} from '@/locale/server';
import {cn} from '@/utils/css';
import type {MarketplaceProduct} from '../../../types';

type ProductCardProps = {
  product: MarketplaceProduct;
  workspaceURI: string;
};

export function ProductCard({product, workspaceURI}: ProductCardProps) {
  const isFree = product.salePrice === 0;
  const price = isFree
    ? null
    : `${product.saleCurrency?.symbol ?? '€'}${product.salePrice.toFixed(2)}`;

  return (
    <div className="flex flex-col rounded-2xl bg-card text-card-foreground overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`${workspaceURI}/marketplace/product/${product.slug}`}>
        <div className="relative h-44 bg-muted flex items-center justify-center overflow-hidden">
          {product.thumbnailImage ? (
            <img
              src={`/file/${product.thumbnailImage.id}`}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <MdDownload className="text-4xl" />
              <span className="text-xs">{t('No image')}</span>
            </div>
          )}
          {product.portalCategorySet?.[0] && (
            <span className="absolute top-3 left-3 text-xs font-medium bg-background/90 rounded-full px-2 py-1">
              {product.portalCategorySet[0].name}
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col gap-2 flex-1">
          <h5 className="font-semibold text-sm line-clamp-2 leading-snug">
            {product.name}
          </h5>

          {product.defaultSupplierPartner && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <HiOutlineUser className="shrink-0" />
              {product.defaultSupplierPartner.simpleFullName ||
                product.defaultSupplierPartner.name ||
                ''}
            </p>
          )}

          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
      </Link>

      <div className="px-4 pb-4 flex items-center justify-between">
        <span
          className={cn('font-semibold text-sm', {
            'text-success-dark': isFree,
            'text-foreground': !isFree,
          })}>
          {price ?? t('Free')}
        </span>
        <Link
          href={`${workspaceURI}/marketplace/product/${product.slug}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {t('View details')}
        </Link>
      </div>
    </div>
  );
}
