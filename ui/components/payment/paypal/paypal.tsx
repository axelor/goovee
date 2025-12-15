'use client';

import {useState} from 'react';
import {PayPalButtons, PayPalScriptProvider} from '@paypal/react-paypal-js';

// ---- CORE IMPORTS ---- //
import {DEFAULT_CURRENCY_CODE} from '@/constants';
import {i18n} from '@/locale';
import {PaymentOption} from '@/types';
import {Portal, Spinner} from '@/ui/components';
import {PaypalProps} from '@/ui/components/payment/types';
import {useToast} from '@/ui/hooks';
import {useEnvironment} from '@/environment';

export function Paypal({
  disabled,
  successMessage = 'Order requested successfully',
  errorMessage = 'Something went wrong while processing your request.',
  onApprove,
  onValidate,
  createOrder,
  captureOrder,
  onPaymentSuccess,
  skipSuccessToast,
}: PaypalProps) {
  const {toast} = useToast();
  const [verifying, setVerifying] = useState(false);

  const handleCreatePaypalOrder = async (
    data: any,
    actions: any,
  ): Promise<any> => {
    if (onValidate) {
      const isValid = await onValidate(PaymentOption.paypal);
      if (!isValid) {
        return '';
      }
    }

    try {
      const result = await createOrder(data, actions);
      if (result.error || !result.order?.id) {
        toast({
          variant: 'destructive',
          title: result.message,
        });
      } else {
        return result?.order?.id;
      }
    } catch (error) {
      console.error('Error while creating paypal order:', error);
      toast({
        variant: 'destructive',
        title: i18n.t('Error processing PayPal payment. Please try again.'),
      });
    }
  };

  const handleApprovePaypalOrder = async (data: any, actions: any) => {
    try {
      setVerifying(true);
      const result = await captureOrder(data.orderID);
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

  const env = useEnvironment();

  return (
    <PayPalScriptProvider
      options={{
        clientId: env.GOOVEE_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: DEFAULT_CURRENCY_CODE,
        intent: 'capture',
        disableFunding: 'card',
      }}>
      <PayPalButtons
        style={{
          color: 'blue',
          shape: 'rect',
          height: 50,
          disableMaxWidth: true,
        }}
        className="mb-[-7px]"
        disabled={disabled}
        createOrder={handleCreatePaypalOrder}
        onApprove={handleApprovePaypalOrder}
      />
      <Portal>
        <Spinner show={verifying} fullscreen />
      </Portal>
    </PayPalScriptProvider>
  );
}

export default Paypal;
