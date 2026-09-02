'use client';

import {useCallback} from 'react';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {Payments} from '@/ui/components/payment';
import {SUBAPP_CODES} from '@/constants';
import {useToast} from '@/ui/hooks';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useCart} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/context/cart-context';
import {i18n} from '@/locale';
import type {SuccessResponse} from '@/types/action';
import {Subapp} from '@/orm/workspace';
import {Cloned} from '@/types/util';

// ---- LOCAL IMPORTS ---- //
import {
  createStripeCheckoutSession,
  paypalCaptureOrder,
  paypalCreateOrder,
  validateStripePayment,
  payboxCreateOrder,
  validatePayboxPayment,
} from '@/subapps/shop/cart/(protected)/checkout/action';
import type {ShopConfig} from '@/subapps/shop/common/orm/config';
import {ORDER_SUCCESS_PARAM} from '@/subapps/shop/common/constants';

type ShopPaymentsProps = {
  config: ShopConfig | Cloned<ShopConfig>;
  orderSubapp?: Subapp | null;
};

export function ShopPayments({config, orderSubapp}: ShopPaymentsProps) {
  const router = useRouter();
  const {toast} = useToast();
  const {url} = useWorkspace();

  const {cart, clearCart} = useCart();
  const noAddress = !(cart?.invoicingAddress && cart?.deliveryAddress);

  const redirectOrder = useCallback(
    async (order: SuccessResponse<string>) => {
      if (orderSubapp) {
        router.replace(url.forRouter(`/${SUBAPP_CODES.orders}/${order.data}`));
      } else {
        router.replace(url.forRouter(`/shop?${ORDER_SUCCESS_PARAM}=true`));
      }
    },
    [url, router, orderSubapp],
  );

  return (
    <>
      <Payments
        config={config}
        onValidate={async () => {
          if (noAddress) {
            toast({
              variant: 'destructive',
              title: i18n.t('Select address to continue'),
            });
            return false;
          }
          return true;
        }}
        onPaypalCreatedOrder={async () => {
          return await paypalCreateOrder({cart});
        }}
        onPaypalCaptureOrder={async orderID => {
          return await paypalCaptureOrder({orderId: orderID});
        }}
        onStripeCreateCheckOutSession={async () => {
          return await createStripeCheckoutSession({cart});
        }}
        onStripeValidateSession={async ({stripeSessionId}) => {
          return validateStripePayment({stripeSessionId});
        }}
        onPaymentSuccess={async () => clearCart()}
        onPayboxCreateOrder={async ({uri}) => {
          return await payboxCreateOrder({cart, uri});
        }}
        onPayboxValidatePayment={async ({params}) => {
          return validatePayboxPayment({params});
        }}
        onApprove={redirectOrder}
        successMessage="Order completed successfully."
        errorMessage="Failed to process your order."
        skipSuccessToast={!orderSubapp}
      />
    </>
  );
}

export default ShopPayments;
