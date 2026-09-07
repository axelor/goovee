'use client';

import {useState} from 'react';
import {
  PayPalOneTimePaymentButton,
  PayPalProvider,
} from '@paypal/react-paypal-js/sdk-v6';

// ---- CORE IMPORTS ---- //
import {i18n, l10n} from '@/locale';
import {transformLocale} from '@/locale/utils';
import {PaymentOption} from '@/types';
import {Portal, Spinner} from '@/ui/components';
import {PaypalProps} from '@/ui/components/payment/types';
import {useToast} from '@/ui/hooks';
import {useEnvironment} from '@/environment';
import {cn} from '@/utils/css';
import styles from './paypal.module.scss';

export function Paypal<TData>({
  disabled,
  successMessage = 'Order requested successfully',
  errorMessage = 'Something went wrong while processing your request.',
  onApprove,
  onValidate,
  createOrder,
  captureOrder,
  onPaymentSuccess,
  skipSuccessToast,
}: PaypalProps<TData>) {
  const {toast} = useToast();
  const [verifying, setVerifying] = useState(false);
  const env = useEnvironment();

  const handleCreateOrder = async (): Promise<{orderId: string}> => {
    if (onValidate) {
      const isValid = await onValidate(PaymentOption.paypal);
      if (!isValid) {
        throw new Error('Validation failed');
      }
    }

    const result = await createOrder();
    if (result.error || !result.order?.id) {
      toast({
        variant: 'destructive',
        title: result.message,
      });
      throw new Error(result.message ?? 'Failed to create paypal order');
    }
    return {orderId: result.order.id};
  };

  const handleApprove = async (data: {orderId: string}): Promise<void> => {
    try {
      setVerifying(true);
      const result = await captureOrder(data.orderId);
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: result.message,
        });
      } else {
        !skipSuccessToast &&
          toast({
            variant: 'success',
            title: i18n.t(successMessage),
          });
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        onApprove?.(result);
      }
    } catch (error) {
      console.error('Error while approving paypal order:', error);
      toast({
        variant: 'destructive',
        title: i18n.t(errorMessage),
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <PayPalProvider
      clientId={env.paypal?.clientId ?? ''}
      components={['paypal-payments']}
      locale={transformLocale(l10n.getLocale()) || undefined}
      pageType="checkout">
      <div className={cn('w-full', styles.wrapper)}>
        <PayPalOneTimePaymentButton
          disabled={disabled}
          presentationMode="auto"
          createOrder={handleCreateOrder}
          onApprove={handleApprove}
        />
      </div>
      <Portal>
        <Spinner show={verifying} fullscreen />
      </Portal>
    </PayPalProvider>
  );
}

export default Paypal;
