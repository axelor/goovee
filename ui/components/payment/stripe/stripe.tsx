'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {Button, Portal, Spinner} from '@/ui/components';
import {i18n} from '@/locale';
import {useSearchParams, useToast} from '@/ui/hooks';
import {StripeProps} from '@/ui/components/payment/types';
import {PaymentOption} from '@/types';

export function Stripe({
  disabled,
  successMessage = 'Payment successful!',
  errorMessage = 'Error processing payment, try again.',
  onValidate,
  onCreateCheckOutSession,
  onValidateSession,
  onPaymentSuccess,
  onApprove,
  skipSuccessToast,
}: StripeProps) {
  const {toast} = useToast();
  const [verifying, setVerifying] = useState(false);
  const {searchParams} = useSearchParams();
  const validateRef = useRef(false);

  const handleCreateCheckoutSession = async (event: any) => {
    event.preventDefault();

    if (onValidate) {
      const isValid = await onValidate(PaymentOption.stripe);
      if (!isValid) {
        return;
      }
    }
    try {
      const result = await onCreateCheckOutSession();

      if (result.error) {
        toast({
          variant: 'destructive',
          title: result.message,
        });
        return;
      }

      const {url} = result;
      window.location.assign(url as string);
    } catch (err) {
      console.error('Error while creating checkout session:', err);
      toast({
        variant: 'destructive',
        title: i18n.t('Error processing stripe payment, try again.'),
      });
    }
  };

  const handleValidateStripePayment = useCallback(
    async ({stripeSessionId}: {stripeSessionId: string}) => {
      try {
        setVerifying(true);

        if (!stripeSessionId) {
          return;
        }

        const result: any = await onValidateSession({
          stripeSessionId,
        });
        if (result.error) {
          toast({
            variant: 'destructive',
            title: i18n.t(result.message || errorMessage),
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
      } catch (err) {
        toast({
          variant: 'destructive',
          title: i18n.t('Error processing Stripe payment, try again.'),
        });
      } finally {
        setVerifying(false);
      }
    },
    [
      errorMessage,
      successMessage,
      onValidateSession,
      toast,
      onPaymentSuccess,
      onApprove,
      skipSuccessToast,
    ],
  );

  const stripeSessionId = searchParams.get('stripe_session_id');
  const stripeError = searchParams.get('stripe_error');

  useEffect(() => {
    if (validateRef.current) {
      return;
    }
    if (!(stripeSessionId || stripeError)) {
      return;
    }

    validateRef.current = true;

    if (stripeError) {
      toast({
        variant: 'destructive',
        title: i18n.t('Error processing Stripe payment, try again.'),
      });
    } else if (stripeSessionId) {
      handleValidateStripePayment({stripeSessionId});
    }
  }, [stripeSessionId, stripeError, toast, handleValidateStripePayment]);

  return (
    <>
      <Button
        className="h-[50px] w-full bg-[#635bff] text-lg font-medium"
        disabled={disabled}
        onClick={handleCreateCheckoutSession}>
        {i18n.t('Pay with Stripe')}
      </Button>
      <Portal>
        <Spinner show={verifying} fullscreen />
      </Portal>
    </>
  );
}

export default Stripe;
