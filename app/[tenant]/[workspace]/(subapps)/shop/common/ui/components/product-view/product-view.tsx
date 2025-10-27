'use client';

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {MdOutlineShoppingBasket} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {
  Quantity,
  ThumbsCarousel,
  Label,
  Button,
  Breadcrumbs,
  NavbarCategoryMenu,
  Textarea,
} from '@/ui/components';
import {useQuantity, useToast} from '@/ui/hooks';
import {i18n} from '@/locale';
import {getProductImageURL} from '@/utils/files';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import type {Category, ComputedProduct, PortalWorkspace} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {ProductMetaFieldView} from '@/subapps/shop/common/ui/components/product-meta-field-view';

export function ProductView({
  product: computedProduct,
  workspace,
  breadcrumbs,
  categories,
  metaFields,
  hidePriceAndPurchase,
}: {
  hidePriceAndPurchase: boolean;
  categories?: any;
  product: ComputedProduct;
  workspace?: PortalWorkspace;
  breadcrumbs: any;
  metaFields: any;
}) {
  const router = useRouter();
  const {workspaceURI, tenant} = useWorkspace();
  const {product, price, errorMessage} = computedProduct;
  const [updating, setUpdating] = useState(false);
  const {quantity, increment, decrement, setQuantity} = useQuantity();
  const {updateQuantity, getProductQuantity, getProductNote, setProductNote} =
    useCart();
  const [cartQuantity, setCartQuantity] = useState(0);
  const [note, setNote] = useState('');
  const {toast} = useToast();

  const {outOfStockConfig} = product;
  const isOutOfStock = outOfStockConfig?.outOfStock;
  const showMessage = outOfStockConfig?.showMessage;
  const canBuy = outOfStockConfig?.canBuy && !hidePriceAndPurchase;

  const handleAddToCart = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (quantity < 1) {
      toast({
        variant: 'destructive',
        description: i18n.t('Enter valid quantity'),
      });
      return;
    }
    setUpdating(true);
    setCartQuantity(quantity);
    await updateQuantity({
      productId: product.id,
      quantity,
      computedProduct,
      images: product.images?.map(String) ?? [],
    });
    toast({title: i18n.t('Added to cart')});
    setUpdating(false);
  };

  const handleChangeNote = async (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const {value} = event.target;
    setNote(value);
    await setProductNote(product.id, value);
  };

  const handleCategoryClick = ({category}: {category: Category}) => {
    router.push(`${workspaceURI}/shop/category/${category.slug}`);
  };

  const handleBreadCrumbClick = (category: any) => {
    handleCategoryClick({category});
  };

  useEffect(() => {
    (async () => {
      if (!product) return;
      const quantity = await getProductQuantity(product.id);
      setCartQuantity(quantity);
      setQuantity(quantity || 1);
      const note = await getProductNote(product.id);
      setNote(note);
    })();
  }, [getProductNote, getProductQuantity, product, setQuantity]);

  return (
    <div>
      <div className="relative">
        <NavbarCategoryMenu
          categories={categories}
          onClick={handleCategoryClick}
        />
      </div>
      <div className="container py-2">
        <div className="my-10">
          <Breadcrumbs
            breadcrumbs={breadcrumbs}
            onClick={handleBreadCrumbClick}
          />
        </div>
        <div className="grid md:grid-cols-[36%_1fr] grid-cols-1 gap-5">
          <div className="overflow-hidden rounded-lg">
            <ThumbsCarousel
              images={
                product.images?.length
                  ? product.images.map(i => ({
                      id: i as string,
                      url: getProductImageURL(i, tenant) as string,
                    }))
                  : [
                      {
                        id: 1,
                        url: getProductImageURL('', tenant, {noimage: true}),
                      },
                    ]
              }
            />
          </div>
          <div className="rounded-lg border bg-card text-card-foreground p-4">
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-xl font-semibold">
                {i18n.tattr(product.name)}
              </p>
              {showMessage && isOutOfStock && (
                <p className="text-base font-semibold mt-0 mb-0 text-destructive">
                  {i18n.t('Out of stock')}
                </p>
              )}
              {errorMessage &&
                workspace?.config?.displayPrices &&
                !hidePriceAndPurchase && (
                  <p className="text-base font-semibold mt-0 mb-0 text-destructive">
                    {i18n.t('Price may be incorrect')}
                  </p>
                )}
            </div>
            {workspace?.config?.displayPrices && !hidePriceAndPurchase && (
              <>
                {price.displayTwoPrices && (
                  <p className="text-xl font-semibold mb-2">
                    {price.displaySecondary}
                  </p>
                )}
                <p className="text-sm">{price.displayPrimary}</p>
              </>
            )}
            <ProductMetaFieldView productId={product.id} fields={metaFields} />
            <span className="font-medium">{i18n.t('Product description')}</span>
            <p
              className="text-sm mb-0"
              dangerouslySetInnerHTML={{
                __html: product.description || '',
              }}></p>
            {Boolean(cartQuantity) && product.allowCustomNote && (
              <div className="flex flex-col gap-2 mt-4">
                <Label>{i18n.t('Note')}</Label>
                <Textarea
                  className="border rounded-lg"
                  value={note}
                  onChange={handleChangeNote}
                />
              </div>
            )}
            <div className="flex flex-col mt-4">
              <p className="mb-2 font-semibold">{i18n.t('Quantity')}</p>
              <Quantity
                value={quantity}
                onIncrement={increment}
                onDecrement={decrement}
                onChange={newValue => setQuantity(Number(newValue))}
                disabled={updating}
              />
            </div>
            {canBuy && (
              <Button
                onClick={handleAddToCart}
                className="w-full rounded-full mt-4">
                <div className="flex items-center justify-center gap-2">
                  <MdOutlineShoppingBasket className="text-2xl" />
                  <span className="text-sm font-medium mb-0">
                    {i18n.t('Add to cart')}
                  </span>
                </div>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProductView;
