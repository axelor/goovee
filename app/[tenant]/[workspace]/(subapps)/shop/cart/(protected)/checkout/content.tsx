'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useSession} from 'next-auth/react';
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
import {type PortalWorkspace} from '@/types';
import {formatNumber} from '@/locale/formatters';
import {calculateAdvanceAmount} from '@/utils/payment';

// ---- LOCAL IMPORTS ---- //
import {findProduct} from '@/subapps/shop/common/actions/cart';
import {AddressSelection} from '@/subapps/shop/common/ui/components/address-selection';
import {SHIPPING_TYPE} from '@/subapps/shop/common/constants/index';
import {ShopPayments} from '@/subapps/shop/common/ui/components';
import styles from './content.module.scss';

const SHIPPING_TYPE_COST = {
  [SHIPPING_TYPE.REGULAR]: 2,
  [SHIPPING_TYPE.FAST]: 5,
};

function Summary({cart}: any) {
  const {tenant} = useWorkspace();
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg">
      <Title className="text-xl font-semibold mb-6" text={i18n.t('Summary')} />
      <div className="flex flex-col gap-4 pt-4">
        {cart.items.map(
          ({
            computedProduct: {product, price} = {} as any,
            quantity,
            note,
            images,
          }: any = {}) => (
            <div key={product?.id} className="flex gap-4">
              <BackgroundImage
                src={getProductImageURL(
                  product?.thumbnailImage?.id || product?.images?.[0],
                  tenant,
                )}
                className="rounded-lg w-[5rem] h-[5rem] bg-cover"
              />
              <div>
                <Title
                  className="text-base font-medium line-clamp-1"
                  text={i18n.tattr(product?.name)}></Title>
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
                  text={price?.displayPrimary}></Title>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
function Total({cart, shippingType, workspace}: any) {
  const {
    total,
    displayTotal,
    scale: {currency: currencyScale},
    currency: {symbol: currencySymbol},
  } = computeTotal({cart, workspace});

  const payInAdvance = workspace.config?.payInAdvance;
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
    percentage: advancePaymentPercentage,
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

function Shipping({value, onChange}: {value: string; onChange: any}) {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg">
      <Title className="text-xl font-medium" text={i18n.t('Shipping method')} />
      <Separator className="my-4" />
      <RadioGroup defaultValue={value}>
        <div className="border rounded-lg flex p-4 gap-4 items-center">
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              name="shipping"
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
              name="shipping"
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

function Title({text, ...rest}: {text: string} & any) {
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
  workspace: PortalWorkspace;
  orderSubapp?: any;
  tenant: string;
}) {
  const {data: session} = useSession();
  const user = session?.user;

  const [shippingType, setShippingType] = useState<string>(
    SHIPPING_TYPE.REGULAR,
  );

  const router = useRouter();
  const {workspaceURI} = useWorkspace();
  const {cart} = useCart();
  const [computedProducts, setComputedProducts] = useState<any[]>([]);
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
          cart.items.map((i: any) =>
            findProduct({
              id: i.product,
              workspace: workspace,
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
  }, [cart, computedProducts, workspace, user, tenant]);

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
                    workspace={workspace}
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
