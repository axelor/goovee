'use client';

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {LuChevronLeft} from 'react-icons/lu';
import {MdDeleteOutline} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {
  Label,
  Button,
  Separator,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  BackgroundImage,
  Quantity,
  Textarea,
} from '@/ui/components';
import {useQuantity, useToast} from '@/ui/hooks';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {computeTotal} from '@/utils/cart';
import {getProductImageURL} from '@/utils/files';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {SEARCH_PARAMS} from '@/constants';
import type {Cart, Product, PortalWorkspace, ComputedProduct} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {findProduct} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/actions/cart';

function CartItem({item, disabled, handleRemove, displayPrices}: any) {
  const [updating, setUpdating] = useState(false);
  const {updateQuantity, getProductNote, setProductNote} = useCart();
  const {workspaceURI, tenant} = useWorkspace();
  const [note, setNote] = useState('');
  const {toast} = useToast();

  // Hooks should always be called unconditionally
  const {quantity, increment, decrement, setQuantity} = useQuantity({
    initialValue: item?.computedProduct ? Number(item.quantity) : 0,
  });

  const handleUpdateQuantity = useCallback(
    async ({
      productId,
      quantity,
      computedProduct,
    }: {
      productId: Product['id'];
      quantity: number;
      computedProduct: ComputedProduct;
    }) => {
      if (quantity > 0) {
        setUpdating(true);
        await updateQuantity({
          productId,
          quantity,
          computedProduct,
          images: computedProduct?.product?.images?.map(String) || [],
        });
        setUpdating(false);
      }
    },
    [updateQuantity],
  );

  useEffect(() => {
    if (item?.computedProduct && Number(quantity) !== Number(item.quantity)) {
      handleUpdateQuantity({
        productId: item.computedProduct?.product?.id,
        quantity,
        computedProduct: item.computedProduct,
      });
    }
  }, [quantity, item, handleUpdateQuantity]);

  useEffect(() => {
    (async () => {
      if (!item?.computedProduct?.product) return;
      const note = await getProductNote(item.computedProduct.product.id);
      setNote(note);
    })();
  }, [getProductNote, item?.computedProduct?.product]);

  const handleChangeNote = async (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const {value} = event.target;
    setNote(value);
    await setProductNote(item.computedProduct.product.id, value);
  };
  const handleChange = (newValue: string | number) => {
    if (Number(newValue) < 1) {
      toast({
        variant: 'destructive',
        description: i18n.t('Enter valid quantity'),
      });
    }
    setQuantity(Number(newValue));
  };

  if (!item.computedProduct) return null;

  const {product, price, errorMessage} = item.computedProduct;

  return (
    <div
      key={item.id}
      className="flex-col md:flex-row flex items-start gap-6 bg-card text-card-foreground p-4 rounded-lg">
      <BackgroundImage
        className="rounded-lg h-[12.5rem] md:w-[12.5rem] w-full min-w-[12.5rem]"
        style={{backgroundSize: 'cover'}}
        src={getProductImageURL(
          product?.thumbnailImage?.id || product?.images?.[0],
          tenant,
        )}
      />
      <div className="flex-col md:flex-row flex gap-4 items-start justify-between w-full h-full">
        <div className="flex flex-col items-start justify-between py-2 w-full h-full flex-1">
          <Link
            className="no-underline text-inherit"
            href={`${workspaceURI}/shop/product/${encodeURIComponent(
              product.slug,
            )}`}>
            <h6 className="font-medium mb-2">{i18n.tattr(product.name)}</h6>
          </Link>
          {errorMessage && (
            <p className="text-sm font-medium mb-2 text-destructive">
              {i18n.t('Price may be incorrect')}
            </p>
          )}
          {product.allowCustomNote && (
            <div className="w-full flex flex-col gap-2 my-4">
              <Label>{i18n.t('Note')}</Label>
              <Textarea
                className="border rounded-lg"
                value={note}
                onChange={handleChangeNote}
              />
            </div>
          )}
          <div className="flex flex-col mt-auto">
            <p className="mb-2 font-semibold">{i18n.t('Quantity')}</p>
            <Quantity
              value={quantity}
              disabled={updating}
              onIncrement={increment}
              onDecrement={decrement}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="flex flex-col items-end ml-auto py-2 h-full">
          <p className="text-xl font-semibold mb-1">
            {displayPrices && price.displayPrimary}
          </p>
          <p className="text-sm font-medium mb-1">
            {displayPrices && price.displaySecondary}
          </p>
          <Button
            disabled={disabled || updating}
            onClick={handleRemove(product)}
            className="w-6 bg-transparent hover:bg-transparent text-destructive p-0 ml-auto mt-auto border-none">
            <MdDeleteOutline className="text-2xl" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CartItems({
  cart,
  disabled,
  onRemove,
  workspace,
}: {
  cart: Cart;
  disabled?: boolean;
  onRemove: (product: Product) => Promise<void>;
  workspace?: PortalWorkspace;
}) {
  const handleRemove =
    (product: Product) => (event: React.MouseEvent<HTMLElement>) => {
      onRemove(product);
    };

  return (
    <div className="flex flex-col gap-6">
      {cart?.items?.map((item: any) => (
        <CartItem
          key={item?.computedProduct?.product?.id}
          item={item}
          disabled={disabled}
          handleRemove={handleRemove}
          displayPrices={workspace?.config?.displayPrices}
        />
      ))}
    </div>
  );
}

function CartSummary({
  cart,
  onRequestQuotation,
  hideRequestQuotation,
  hideCheckout,
  workspace,
}: {
  cart: Cart;
  onRequestQuotation: any;
  hideRequestQuotation?: boolean;
  hideCheckout?: boolean;
  workspace?: PortalWorkspace;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const noitem = !cart?.items?.length;
  const {displayTotal} = computeTotal({cart, workspace});
  const {workspaceURI, tenant} = useWorkspace();
  const {data: session} = useSession();
  const authenticated = session?.user?.id;

  return (
    <div className="col-span-12 xl:col-span-3 p-4 bg-card text-card-foreground rounded-lg">
      {workspace?.config?.displayPrices && (
        <>
          <p className="text-xl font-semibold mb-6">{i18n.t('Total')}</p>
          <Separator className="mb-2" />
          <div className="flex justify-between">
            <p className="mb-4">{i18n.t('Products')}</p>
            <p className="font-semibold mb-4">{displayTotal}</p>
          </div>
          <div className="flex justify-between">
            <p className="mb-4">{i18n.t('Shipping')}</p>
            <p className="text-xs mb-4">{i18n.t('To be determined')}</p>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between my-4">
            <p className="font-medium">{i18n.t('Total Price')}</p>
            <p className="text-xl font-semibold mb-0">{displayTotal}</p>
          </div>
        </>
      )}
      {authenticated ? (
        <>
          {!hideCheckout && (
            <Button
              className="w-full rounded-full mb-4"
              disabled={noitem}
              onClick={() => router.push(`${workspaceURI}/shop/cart/checkout`)}>
              {i18n.t('Checkout')}
            </Button>
          )}
          {!hideRequestQuotation && (
            <Button
              variant="outline"
              className="w-full rounded-full mb-4"
              disabled={noitem}
              onClick={onRequestQuotation}>
              {i18n.t('Request Quotation')}
            </Button>
          )}
        </>
      ) : (
        <Link
          className="no-underline text-inherit"
          href={`/auth/login?callbackurl=${encodeURIComponent(
            pathname,
          )}&workspaceURI=${encodeURIComponent(workspaceURI)}&${SEARCH_PARAMS.TENANT_ID}=${encodeURIComponent(tenant)}`}>
          <Button className="mb-4 w-full rounded-full">
            {i18n.t('Login for checkout')}
          </Button>
        </Link>
      )}
      <Separator className="mb-4" />
      <div className="flex items-center">
        <LuChevronLeft className="text-2xl" />
        <Button className="w-full rounded-full">
          <Link
            href={`${workspaceURI}/shop`}
            className="no-underline text-inherit">
            {i18n.t('Continue Shopping')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function Content({
  workspace,
  tenant,
}: {
  workspace?: PortalWorkspace;
  tenant: string;
}) {
  const {data: session} = useSession();
  const user = session?.user;

  const {cart, removeItem} = useCart();
  const {workspaceURI} = useWorkspace();
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [computedProducts, setComputedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmationDialog, setConfirmationDialog] = useState<any>(null);

  const handleRemoveProduct = async (product: Product) => {
    setUpdating(true);
    await removeItem(product.id);
    setUpdating(false);
  };

  const openConfirmation = (confirmationDialog: {
    title: string;
    onContinue: any;
  }) => {
    setConfirmationDialog(confirmationDialog);
  };

  const closeConfirmation = () => {
    setConfirmationDialog(null);
  };

  const openProductConfirmation = async (product: Product) => {
    openConfirmation({
      title: `${i18n.t('Do you want to remove')} ${product?.name}?`,
      onContinue: () => handleRemoveProduct(product),
    });
  };

  const openQuotationConfirmation = () => {
    openConfirmation({
      title: i18n.t('Do you want to request quotation?'),
      onContinue: handleRequestQuotation,
    });
  };

  const handleRequestQuotation = async () => {
    closeConfirmation();
    router.replace(`${workspaceURI}/shop/cart/request-quotation`);
  };

  useEffect(() => {
    const init = async () => {
      const computedProductIDs = computedProducts
        .map(cp => cp?.product?.id)
        .filter(Boolean);

      const cartItemIDs = cart?.items?.map((i: any) => i.product);

      const diff = cartItemIDs?.filter(
        (id: string) => !computedProductIDs.includes(id),
      );

      if (diff?.length) {
        await Promise.all(
          cart.items.map((i: any) =>
            findProduct({
              id: i.product,
              workspace,
            }),
          ),
        )
          .then(computedProducts => {
            if (computedProducts) {
              const computedItemIds = computedProducts.map(
                cp => cp?.product?.id,
              );

              const unavailableProductIds = cartItemIDs.filter(
                (i: string | number) => !computedItemIds.includes(i),
              );

              unavailableProductIds?.forEach(removeItem);

              setComputedProducts(computedProducts);
            }
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    };
    init();
  }, [cart, computedProducts, workspace, user, tenant, removeItem]);

  const $cart = useMemo(
    () => ({
      ...cart,
      items: [
        ...(cart?.items ?? []).map((i: any) => ({
          ...i,
          computedProduct: computedProducts.find(
            cp => Number(cp?.product?.id) === Number(i.product),
          ),
        })),
      ],
    }),
    [cart, computedProducts],
  );

  if (loading) {
    return <p>{i18n.t('Loading')}...</p>;
  }

  return (
    <div className="container flex flex-col gap-6 mx-auto">
      <h4 className="mb-6 text-xl font-medium">{i18n.t('Cart')}</h4>
      <div className="grid mb-[5rem] lg:mb-0 grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-9">
          {cart?.items?.length ? (
            <CartItems
              cart={$cart}
              onRemove={openProductConfirmation}
              disabled={updating}
              workspace={workspace}
            />
          ) : (
            <p className="text-xl font-bold">{i18n.t('Your cart is empty.')}</p>
          )}
        </div>
        <CartSummary
          cart={$cart}
          onRequestQuotation={openQuotationConfirmation}
          workspace={workspace}
          hideRequestQuotation={!workspace?.config?.requestQuotation}
          hideCheckout={!workspace?.config?.confirmOrder}
        />
        <AlertDialog open={Boolean(confirmationDialog)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmationDialog?.title}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeConfirmation}>
                {i18n.t('Cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  confirmationDialog?.onContinue();
                  closeConfirmation();
                }}>
                {i18n.t('Continue')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
