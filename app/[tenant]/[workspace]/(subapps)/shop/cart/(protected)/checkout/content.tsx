'use client';

import React, {useEffect, useMemo, useState} from 'react';
import type {Cloned} from '@/types/util';
import {authClient} from '@/lib/auth-client';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {
  Separator,
  Label,
  RadioGroup,
  RadioGroupItem,
  BackgroundImage,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/ui/components';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {scale} from '@/utils';
import {computeTotal} from '@/utils/cart';
import {getProductImageURL} from '@/utils/files';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {type PortalWorkspace, type Subapp} from '@/orm/workspace';
import {formatNumber} from '@/locale/formatters';
import {calculateAdvanceAmount} from '@/utils/payment';
import type {ComputedProduct} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {findProduct} from '@/subapps/shop/common/actions/cart';
import {AddressSelection} from '@/subapps/shop/common/ui/components/address-selection';
import {SHIPPING_TYPE} from '@/subapps/shop/common/constants/index';
import {ShopPayments} from '@/subapps/shop/common/ui/components';
import type {CheckoutCart} from '@/subapps/shop/common/types';
import styles from './content.module.scss';

const SHIPPING_TYPE_COST = {
  [SHIPPING_TYPE.REGULAR]: 2,
  [SHIPPING_TYPE.FAST]: 5,
};

function Summary({cart}: {cart: CheckoutCart}) {
  const {tenant} = useWorkspace();
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg">
      <Title className="text-xl font-semibold mb-6" text={i18n.t('Summary')} />
      <div className="flex flex-col gap-4 pt-4">
        {cart.items.map(({computedProduct, quantity, note}) => (
          <div key={computedProduct?.product?.id} className="flex gap-4">
            <BackgroundImage
              src={getProductImageURL(
                computedProduct?.product?.thumbnailImage?.id ||
                  computedProduct?.product?.images?.[0] ||
                  '',
                tenant,
              )}
              className="rounded-lg w-[5rem] h-[5rem] bg-cover"
            />
            <div>
              <Title
                className="text-base font-medium line-clamp-1"
                text={i18n.tattr(computedProduct?.product?.name ?? '')}></Title>
              {note && (
                <div>
                  {i18n.t('Note')} : {note}
                </div>
              )}
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium">{i18n.t('Quantity')}</p>
                <p className="border rounded px-4">{quantity}</p>
              </div>
              <Title
                className="font-semibold"
                text={computedProduct?.price?.displayPrimary ?? ''}></Title>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function Total({
  cart,
  shippingType,
  workspace,
}: {
  cart: CheckoutCart;
  shippingType: string;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  const {
    total,
    displayTotal,
    scale: {currency: currencyScale},
    currency: {symbol: currencySymbol},
  } = computeTotal({cart, workspace});

  const payInAdvance = workspace.config?.payInAdvance ?? false;
  const advancePaymentPercentage = workspace.config?.advancePaymentPercentage;

  const shipping = Number(
    scale(SHIPPING_TYPE_COST[shippingType], currencyScale),
  ) as number;

  const totalAmount = Number(total) + Number(shipping);

  const totalWithShipping = formatNumber(totalAmount, {
    currency: currencySymbol,
    scale: currencyScale,
    type: 'DECIMAL',
  });

  const advanceAmount = calculateAdvanceAmount({
    amount: Number(total),
    percentage:
      advancePaymentPercentage !== null
        ? Number(advancePaymentPercentage)
        : undefined,
    payInAdvance,
  });

  return (
    <div className="rounded-lg p-4 bg-card text-card-foreground">
      <Title className="text-xl font-semibold mb-6" text={i18n.t('Total')} />
      <Separator className="my-4" />
      <div className="flex justify-between">
        <p>{i18n.t('Products')}:</p>
        <div>
          <p className="font-semibold text-right">{displayTotal}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <p>{i18n.t('Shipping')}:</p>
        <div>
          <p className="text-xs">
            {formatNumber(shipping, {
              scale: currencyScale,
              currency: currencySymbol,
              type: 'DECIMAL',
            })}
          </p>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center justify-between">
        <p className="font-medium font-m">{i18n.t('Total price')}:</p>
        <div>
          <p className="text-xl font-semibold">{`${totalWithShipping} `}</p>
        </div>
      </div>
      {payInAdvance && advanceAmount && (
        <>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <p className="font-medium">{i18n.t('Advance Amount Due')}:</p>
            <div>
              <p className="text-lg font-semibold">
                {formatNumber(advanceAmount, {
                  currency: currencySymbol,
                  scale: currencyScale,
                  type: 'DECIMAL',
                })}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Shipping({
  value,
  onChange,
}: {
  value: string;
  onChange: React.ReactEventHandler;
}) {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg">
      <Title className="text-xl font-medium" text={i18n.t('Shipping method')} />
      <Separator className="my-4" />
      <RadioGroup name="shipping" defaultValue={value}>
        <div className="border rounded-lg flex p-4 gap-4 items-center">
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={SHIPPING_TYPE.REGULAR}
              className={`${styles.radio}`}
              onClick={onChange}
              id="r1"
            />
            <Label className="font-medium !ml-4" htmlFor="r1">
              {i18n.t('Regular Shipping')}{' '}
              <small className="text-xs font-medium ml-1">{`5-10 ${i18n.t(
                'Business Days',
              )}`}</small>
            </Label>
          </div>

          <Title className="text-xs font-medium ml-auto" text="2.00 €" />
        </div>

        <div className="border rounded-lg flex p-4 gap-4 mt-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={SHIPPING_TYPE.FAST}
              className={`${styles.radio}`}
              onClick={onChange}
              id="r2"
            />
            <Label className="font-medium !ml-4" htmlFor="r1">
              {i18n.t('Fast Shipping')}{' '}
              <small className="text-xs font-medium ml-1">{`2-3 ${i18n.t(
                'Business Days',
              )}`}</small>
            </Label>
          </div>

          <Title className="text-xs font-medium ml-auto" text="5.00 €" />
        </div>
      </RadioGroup>
    </div>
  );
}

function Title({
  text,
  ...rest
}: {text: string} & React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className="font-bold text-3xl" {...rest}>
      {text}
    </h3>
  );
}

export default function Content({
  workspace,
  orderSubapp,
  tenant,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  orderSubapp?: Subapp | null;
  tenant: string;
}) {
  const {data: session} = authClient.useSession();
  const user = session?.user;
  const userId = user?.id;

  const [shippingType, setShippingType] = useState<string>(
    SHIPPING_TYPE.REGULAR,
  );

  const router = useRouter();
  const {workspaceURI, workspaceURL} = useWorkspace();
  const {cart} = useCart();
  const [computedProducts, setComputedProducts] = useState<
    (ComputedProduct | null)[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [confirmationDialog, setConfirmationDialog] = useState(false);

  const confirmOrder = workspace?.config?.confirmOrder;

  const closeConfirmation = () => {
    setConfirmationDialog(false);
  };

  const handleConfirmOrder = () => {
    closeConfirmation();
    router.replace(`${workspaceURI}/shop/cart/checkout/request-order`);
  };

  const handleChangeShippingType = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setShippingType(event.target.value);
  };

  useEffect(() => {
    const init = async () => {
      if (!computedProducts?.length && cart) {
        await Promise.all(
          cart.items.map((i: {product: string | number}) =>
            findProduct({
              id: String(i.product),
              workspace: workspace,
              workspaceURL,
            }),
          ),
        )
          .then(computedProducts => {
            setComputedProducts(computedProducts);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    };
    init();
  }, [cart, computedProducts, workspace, userId, tenant, workspaceURL]);

  const $cart = useMemo(
    () => ({
      ...cart,
      items: [
        ...(cart?.items ?? []).map((i: {product: string | number}) => ({
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
  if (!cart?.items?.length) {
    return <p className="text-xl font-bold">{i18n.t('Your cart is empty.')}</p>;
  }

  return (
    <>
      <h4 className="mb-6 text-xl font-medium">{i18n.t('Confirm Cart')}</h4>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-9">
          <div className="flex flex-col gap-6">
            <AddressSelection />
            <Shipping
              value={shippingType}
              onChange={handleChangeShippingType}
            />
          </div>
        </div>
        <div className="col-span-12 xl:col-span-3">
          <div className="flex flex-col gap-6">
            <Summary cart={$cart} />
            <Total
              cart={$cart}
              shippingType={shippingType}
              workspace={workspace}
            />
            <div className="flex flex-col gap-2">
              {confirmOrder ? (
                <>
                  <ShopPayments
                    config={workspace.config}
                    orderSubapp={orderSubapp}
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <AlertDialog open={Boolean(confirmationDialog)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {i18n.t('Do you want to confirm order?')}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmation}>
              {i18n.t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOrder}>
              {i18n.t('Continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
