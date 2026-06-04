'use client';

import {Fragment} from 'react';
import {useRouter} from 'next/navigation';
import {MdEast} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useToast} from '@/ui/hooks';
import {useCart} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/context/cart-context';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import type {ComputedProduct} from '@/types';
import type {Cloned} from '@/types/util';
import type {PortalWorkspace} from '@/orm/workspace';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {ProductCard} from '@/subapps/shop/common/ui/components';
import type {FeaturedCategory} from '@/subapps/shop/common/types';

export function FeaturedCategories({
  categories,
  workspace,
  hidePriceAndPurchase,
}: {
  categories: FeaturedCategory[];
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  hidePriceAndPurchase: boolean;
}) {
  const router = useRouter();

  const {workspaceURI} = useWorkspace();
  const {cart, addItem} = useCart();
  const {toast} = useToast();

  const handleAddProduct = async (computedProduct: ComputedProduct) => {
    const {product} = computedProduct;

    await addItem({
      productId: product?.id,
      quantity: 1,
      images: product?.images?.map(String) || [],
      computedProduct: computedProduct,
    });

    toast({
      title: i18n.t('Added to cart'),
    });
  };

  return categories?.map(category =>
    category?.products?.length ? (
      <Fragment key={category.id}>
        <div className="flex justify-between items-center">
          <h3 className="text-xl leading-7 font-medium">{category.name}</h3>
          <Link href={`${workspaceURI}/shop/category/${category.slug}`}>
            <div className="flex gap-2 px-3 py-4 cursor-pointer">
              <span className="leading-6 text-sm">{i18n.t('See All')}</span>
              <MdEast className="w-6 h-6" />
            </div>
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {category.products.map((computedProduct: ComputedProduct) => {
            const quantity = cart?.items?.find(
              (i: {product: string | number}) =>
                Number(i.product) === Number(computedProduct?.product.id),
            )?.quantity;

            return (
              <ProductCard
                hidePriceAndPurchase={hidePriceAndPurchase}
                key={computedProduct.product.id}
                product={computedProduct}
                quantity={quantity}
                onAdd={handleAddProduct}
                category={{
                  ...category,
                  name: category.name ?? '',
                  slug: category.slug ?? '',
                }}
                displayPrices={Boolean(workspace?.config?.displayPrices)}
              />
            );
          })}
        </div>
      </Fragment>
    ) : null,
  );
}

export default FeaturedCategories;
