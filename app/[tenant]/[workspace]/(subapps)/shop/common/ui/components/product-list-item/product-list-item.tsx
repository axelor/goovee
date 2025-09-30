'use client';

import React from 'react';
import {MdAddShoppingCart} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Button, BackgroundImage} from '@/ui/components';
import {cn} from '@/utils/css';
import {getProductImageURL} from '@/utils/files';
import {useResponsive} from '@/ui/hooks';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import type {Category, ComputedProduct, ID, Product} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {Link} from '@/subapps/shop/common/ui/components';

export type ProductListItemProps = {
  product: ComputedProduct;
  quantity?: string | number;
  onAdd: (product: ComputedProduct) => Promise<void>;
  displayPrices?: boolean;
  category: Category;
  hidePriceAndPurchase: boolean;
};

export function ProductListItem({
  product: computedProduct,
  quantity = 0,
  onAdd,
  displayPrices,
  category,
  hidePriceAndPurchase,
}: ProductListItemProps) {
  const {product, price, errorMessage} = computedProduct;
  const {displayTwoPrices, displayPrimary, displaySecondary} = price;
  const {tenant, workspaceURI} = useWorkspace();

  const {outOfStockConfig} = product;
  const isOutOfStock = outOfStockConfig?.outOfStock;
  const showMessage = outOfStockConfig?.showMessage;
  const canBuy = outOfStockConfig?.canBuy && !hidePriceAndPurchase;

  const handleAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onAdd(computedProduct);
  };

  const res: any = useResponsive();
  const large = ['md', 'lg', 'xl', 'xxl'].some(x => res[x]);

  return (
    <div className="rounded-2xl grid grid-cols-1 md:grid-cols-[14.875rem_1fr] gap-6 w-full bg-card text-card-foreground">
      <Link
        href={`${workspaceURI}/shop/category/${category.slug}/product/${product.slug}`}
        className="cursor-pointer">
        <BackgroundImage
          className="rounded-l-lg relative bg-cover md:w-[14.875rem] w-[5rem] md:h-[14.6875rem] h-[5rem]"
          src={getProductImageURL(product.images?.[0] as ID, tenant)}>
          {Boolean(quantity) && (
            <div className="border shadow-lg absolute bottom-4 right-4 bg-card p-1 md:p-4 rounded-full flex items-center justify-center w-[1.875rem] md:w-[3.75rem] h-[1.875rem] md:h-[3.75rem]">
              <p className="mb-0 text-sm md:text-xl">{quantity}</p>
            </div>
          )}
        </BackgroundImage>
      </Link>
      <div className="p-6 pl-6 md:pl-0 flex flex-col justify-between gap-4">
        <Link
          href={`${workspaceURI}/shop/category/${category.slug}/product/${product.slug}`}
          className="cursor-pointer">
          <div className="flex-col md:flex-row flex justify-between mb-6">
            <div>
              <p className="font-medium mb-2 md:mb-0">
                {i18n.tattr(product.name)}
              </p>
              {showMessage && isOutOfStock && (
                <p className="text-xs font-semibold mt-0 mb-0 text-destructive">
                  {i18n.t('Out of stock')}
                </p>
              )}
              {errorMessage && displayPrices && !hidePriceAndPurchase && (
                <p className="text-xs font-semibold mt-0 mb-0 text-destructive">
                  {i18n.t('Price may be incorrect')}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              {displayPrices && !hidePriceAndPurchase && (
                <>
                  <h4 className="text-xl font-semibold mb-0">
                    {displayPrimary}
                  </h4>
                  {displayTwoPrices && (
                    <p className="text-sm font-medium mt-2 mb-0">
                      {displaySecondary}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <p
            className="text-xs mb-4 md:mb-0 line-clamp-3"
            dangerouslySetInnerHTML={{
              __html: product.description || '',
            }}></p>
        </Link>
        {canBuy && (
          <div className="flex justify-end">
            <Button
              onClick={handleAdd}
              className="flex gap-2 items-center rounded-full w-12 md:w-auto h-12 md:h-auto">
              <div className="inline-flex">
                <MdAddShoppingCart className="text-2xl" />
              </div>
              {large && (
                <p className="text-sm font-medium mb-0 text-primary-foreground">
                  {i18n.t('Add to cart')}
                </p>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
export default ProductListItem;
