import {HiOutlineUser} from 'react-icons/hi';
import {MdOutlineCategory, MdDownload, MdShoppingBag} from 'react-icons/md';
import {t} from '@/locale/server';
import {Button} from '@/ui/components';

import type {MarketplaceProduct} from '../../../types';
import {ProductViewTabs} from './product-view-tabs';

type ProductViewProps = {
  product: MarketplaceProduct;
  hasPurchased?: boolean;
};

export function ProductView({product, hasPurchased = false}: ProductViewProps) {
  const isFree = product.salePrice === 0;
  const price = isFree
    ? null
    : `${product.saleCurrency?.symbol ?? '€'}${product.salePrice.toFixed(2)}`;

  const latestVersion = product.marketplaceVersionList?.find(v => v.isLatest);

  return (
    <div className="container portal-container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — image + tabs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="w-full h-64 rounded-2xl bg-muted overflow-hidden flex items-center justify-center">
            {product.picture ? (
              <img
                src={`/file/${product.picture.id}`}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <MdDownload className="text-5xl" />
                <span className="text-sm">{t('No image')}</span>
              </div>
            )}
          </div>

          <ProductViewTabs product={product} hasPurchased={hasPurchased} />
        </div>

        {/* Right — purchase card */}
        <div className="flex flex-col gap-4">
          <div className="bg-card rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <h1 className="text-xl font-bold leading-snug">{product.name}</h1>

            {product.defaultSupplierPartner && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <HiOutlineUser />
                {t('by')}{' '}
                <span className="font-medium text-foreground">
                  {product.defaultSupplierPartner.name}
                </span>
              </p>
            )}

            {product.portalCategorySet?.length ? (
              <div className="flex flex-wrap gap-2">
                {product.portalCategorySet.map(cat => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1">
                    <MdOutlineCategory className="text-sm" />
                    {cat.name}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="border-t pt-4">
              <p className="text-3xl font-bold">{price ?? t('Free')}</p>
              {latestVersion && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('Latest: v{0}', latestVersion.version)}
                </p>
              )}
            </div>

            {hasPurchased || isFree ? (
              <Button className="w-full gap-2">
                <MdDownload className="text-lg" />
                {t('Download')}
              </Button>
            ) : (
              <Button className="w-full gap-2">
                <MdShoppingBag className="text-lg" />
                {t('Buy — {0}', price ?? '')}
              </Button>
            )}

            {hasPurchased && (
              <p className="text-xs text-green-600 font-medium text-center">
                {t('✓ You own this software')}
              </p>
            )}
          </div>

          {product.portalImageList && product.portalImageList.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {product.portalImageList.slice(0, 6).map(img => (
                <div
                  key={img.id}
                  className="aspect-square rounded-lg bg-muted overflow-hidden">
                  <img
                    src={`/file/${img.picture.id}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
