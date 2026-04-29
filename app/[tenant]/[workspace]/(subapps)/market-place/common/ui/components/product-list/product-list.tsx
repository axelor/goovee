import Link from 'next/link';
import {MdOutlineShoppingCart} from 'react-icons/md';

import {cn} from '@/utils/css';
import type {MarketplaceCategory, MarketplaceProduct, SearchParams} from '../../../types';
import {ProductCard} from '../product-card';
import {ProductSearch} from '../product-search';

type ProductListProps = {
  products: MarketplaceProduct[];
  categories: MarketplaceCategory[];
  workspaceURI: string;
  activeCategory?: MarketplaceCategory;
  searchParams?: SearchParams;
};

export function ProductList({
  products,
  categories,
  workspaceURI,
  activeCategory,
  searchParams = {},
}: ProductListProps) {
  const view = searchParams.view ?? 'grid';
  const search = searchParams.search ?? '';

  return (
    <div>
      <ProductSearch defaultSearch={search} defaultView={view} />

      <div className="container portal-container py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Categories
            </p>
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  href={`${workspaceURI}/market-place`}
                  className={cn(
                    'block text-sm px-3 py-2 rounded-lg hover:bg-muted transition-colors',
                    {'bg-primary/10 text-primary font-medium': !activeCategory},
                  )}>
                  All software
                </Link>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link
                    href={`${workspaceURI}/market-place/category/${cat.slug}`}
                    className={cn(
                      'block text-sm px-3 py-2 rounded-lg hover:bg-muted transition-colors',
                      {'bg-primary/10 text-primary font-medium': activeCategory?.id === cat.id},
                    )}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {activeCategory && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold">{activeCategory.name}</h2>
                {activeCategory.subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeCategory.subtitle}
                  </p>
                )}
              </div>
            )}

            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                <p className="text-sm">No software found.</p>
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} workspaceURI={workspaceURI} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {products.map(p => (
                  <ProductListRow key={p.id} product={p} workspaceURI={workspaceURI} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductListRow({product, workspaceURI}: {product: MarketplaceProduct; workspaceURI: string}) {
  const price =
    product.salePrice === 0
      ? 'Free'
      : `${product.saleCurrency?.symbol ?? '€'}${product.salePrice.toFixed(2)}`;

  return (
    <Link
      href={`${workspaceURI}/market-place/product/${product.slug}`}
      className="flex gap-4 bg-card rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden flex items-center justify-center">
        {product.thumbnailImage ? (
          <img
            src={`/file/${product.thumbnailImage.id}`}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <MdOutlineShoppingCart className="text-2xl text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="font-semibold text-sm line-clamp-1">{product.name}</h5>
        {product.defaultSupplierPartner && (
          <p className="text-xs text-muted-foreground mt-0.5">
            by {product.defaultSupplierPartner.name}
          </p>
        )}
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <span className="font-semibold text-sm">{price}</span>
      </div>
    </Link>
  );
}

export default ProductList;
