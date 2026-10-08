'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {PAYMENT_SOURCE} from '@/payment/domain/types';
import type {OfferedGateway} from '@/payment/offer';
import {PaymentMethods} from '@/ui/components/payment/payment-methods';
import {useToast} from '@/ui/hooks';
import {useCart} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/context/cart-context';

type ShopPaymentsProps = {
  gateways: OfferedGateway[];
  checkoutToken: string;
};

/**
 * The payment buttons of the shop checkout. The cart is read when a button is
 * pressed and sent as the intent; the server prices it again. The outcome is
 * shown by the payment page the gateway sends the browser back to, which
 * continues to the order confirmation.
 */
export function ShopPayments({gateways, checkoutToken}: ShopPaymentsProps) {
  const {toast} = useToast();
  const {cart, loaded} = useCart();
  const noAddress = !(cart?.invoicingAddress && cart?.deliveryAddress);

  return (
    <PaymentMethods
      gateways={gateways}
      source={PAYMENT_SOURCE.shop}
      intent={() => ({cart})}
      checkoutToken={checkoutToken}
      /* Pressing before the cart has been read sends no cart at all, which the
       * server can only refuse as an invalid request. */
      disabled={!loaded}
      onValidate={() => {
        if (noAddress) {
          toast({
            variant: 'destructive',
            title: i18n.t('Select address to continue'),
          });
          return false;
        }
        return true;
      }}
    />
  );
}

export default ShopPayments;
