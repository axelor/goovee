'use client';

import {useCallback} from 'react';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {PortalWorkspace} from '@/types';
import {Payments} from '@/ui/components/payment';
import {SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {useToast} from '@/ui/hooks';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {i18n} from '@/locale';
import {
  createStripeCheckoutSession,
  paypalCaptureOrder,
  paypalCreateOrder,
  validateStripePayment,
  payboxCreateOrder,
  validatePayboxPayment,
} from '@/subapps/shop/cart/(protected)/checkout/action';
import {ORDER_SUCCESS_PARAM} from '@/subapps/shop/common/constants';

interface ShopPaymentsProps {
  workspace: PortalWorkspace;
  orderSubapp?: any;
}

export function ShopPayments({workspace, orderSubapp}: ShopPaymentsProps) {
  const router = useRouter();
  const {toast} = useToast();
  const {workspaceURI, workspaceURL} = useWorkspace();

  const {cart, clearCart} = useCart();
  const noAddress = !(cart?.invoicingAddress && cart?.deliveryAddress);

  const redirectOrder = useCallback(
    async (order: any) => {
      if (orderSubapp) {
        router.replace(
          `${workspaceURI}/${SUBAPP_CODES.orders}/${SUBAPP_PAGE.orders}/${order.data}`,
        );
      } else {
        router.replace(`${workspaceURI}/shop?${ORDER_SUCCESS_PARAM}=true`);
      }
    },
    [workspaceURI, router, orderSubapp],
  );

  return (
    <>
      <Payments
        workspace={workspace}
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
          return await paypalCreateOrder({cart, workspaceURL});
        }}
        onPaypalCaptureOrder={async orderID => {
          return await paypalCaptureOrder({
            orderId: orderID,
            workspaceURL,
          });
        }}
        onStripeCreateCheckOutSession={async () => {
          return await createStripeCheckoutSession({
            cart,
            workspaceURL,
          });
        }}
        onStripeValidateSession={async ({stripeSessionId}) => {
          return validateStripePayment({
            stripeSessionId,
            workspaceURL,
          });
        }}
        onPaymentSuccess={async () => clearCart()}
        onPayboxCreateOrder={async ({uri}) => {
          return await payboxCreateOrder({
            cart,
            workspaceURL,
            uri,
          });
        }}
        onPayboxValidatePayment={async ({params}) => {
          return validatePayboxPayment({params, workspaceURL});
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
