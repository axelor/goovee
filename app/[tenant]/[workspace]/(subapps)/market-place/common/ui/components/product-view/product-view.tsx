import {HiOutlineUser} from 'react-icons/hi';
import {MdOutlineShoppingCart, MdOutlineCategory} from 'react-icons/md';

import type {MarketplaceProduct} from '../../../types';
import {ProductViewTabs} from './product-view-tabs';

type ProductViewProps = {
  product: MarketplaceProduct;
  hasPurchased?: boolean;
};

export function ProductView({product, hasPurchased = false}: ProductViewProps) {
  const price =
    product.salePrice === 0
      ? 'Free'
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
                <MdOutlineShoppingCart className="text-5xl" />
                <span className="text-sm">No image</span>
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
                by{' '}
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
              <p className="text-3xl font-bold">{price}</p>
              {latestVersion && (
                <p className="text-xs text-muted-foreground mt-1">
                  Latest: v{latestVersion.version}
                </p>
              )}
            </div>

            <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              {hasPurchased
                ? 'View downloads'
                : product.salePrice === 0
                ? 'Get for free'
                : 'Add to cart'}
            </button>

            {hasPurchased && (
              <p className="text-xs text-green-600 font-medium text-center">
                ✓ You own this software
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

export default ProductView;
