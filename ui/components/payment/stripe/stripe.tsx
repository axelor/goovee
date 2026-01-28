'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {
  Button,
  Portal,
  Spinner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/ui/components';
import {i18n} from '@/locale';
import {useSearchParams, useToast} from '@/ui/hooks';
import type {
  BankTransferDetailsType,
  StripeProps,
} from '@/ui/components/payment/types';
import {PaymentOption} from '@/types';
import {BankTransferDetails} from './bank-transfer-details';
import {BankTransferConfirmDialog} from './bank-transfer-confirmation-dialog';
import {BANK_TRANSFER_STATUS} from '@/lib/core/payment/stripe/constants';

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
  onCreateBankTransferIntent,
}: StripeProps) {
  const {toast} = useToast();
  const [verifying, setVerifying] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [bankTransferDetails, setBankTransferDetails] =
    useState<BankTransferDetailsType | null>(null);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBankTransferConfirm, setShowBankTransferConfirm] = useState(false);

  const {searchParams} = useSearchParams();
  const validateRef = useRef(false);

  const router = useRouter();

  const isBankTransferEnabled = Boolean(onCreateBankTransferIntent);

  const handleBankDetailsDialogClose = () => {
    setShowPaymentOptions(false);
    setShowBankDetails(false);
    router.refresh();
  };

  const handlePaymentClick = async (event: any) => {
    event.preventDefault();

    if (onValidate) {
      const isValid = await onValidate(PaymentOption.stripe);
      if (!isValid) {
        return;
      }
    }

    setShowPaymentOptions(true);
  };

  const handleCardPayment = async () => {
    try {
      setVerifying(true);
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
    } finally {
      setVerifying(false);
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

  const handleBankTransferPayment = async () => {
    if (!onCreateBankTransferIntent) {
      toast({
        variant: 'destructive',
        title: i18n.t('Bank transfer is not supported'),
      });
      return;
    }
    setIsLoading(true);
    try {
      const result = await onCreateBankTransferIntent();

      if (result.error) {
        toast({
          variant: 'destructive',
          title: result.message || i18n.t('Error creating bank transfer'),
        });
        return;
      }

      const data = result.data;

      // CASE 1: Auto-paid via customer's balance
      if (data.status === BANK_TRANSFER_STATUS.PAID) {
        toast({
          variant: 'success',
          title: i18n.t('Payment completed successfully'),
        });

        handleBankDetailsDialogClose();
        return;
      }

      // CASE 2: Needs bank transfer
      if (data.status === BANK_TRANSFER_STATUS.PENDING && data.bankDetails) {
        setBankTransferDetails(data);
        setShowBankDetails(true);
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: i18n.t('Error processing bank transfer, try again.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBankTransferDialogOpenChange = (open: boolean) => {
    if (isLoading) return;
    setShowBankTransferConfirm(open);
  };

  const handleBankTransferCancel = () => {
    setShowBankTransferConfirm(false);
  };

  const handleBankTransferConfirm = async () => {
    setShowBankTransferConfirm(false);
    await handleBankTransferPayment();
  };

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
        onClick={handlePaymentClick}>
        {i18n.t('Pay with Stripe')}
      </Button>

      <Dialog
        open={showPaymentOptions}
        onOpenChange={() => !isLoading && setShowPaymentOptions(false)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium mb-4">
              {i18n.t('Select Payment Method (Stripe)')}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 p-4 border rounded-lg">
                <div
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={handleCardPayment}>
                  <div className="flex items-center">
                    <div className="mr-3 text-xl">💳</div>
                    <div>
                      <h4 className="font-medium">
                        {i18n.t('Credit or Debit Card')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {i18n.t('Pay immediately with your card')}
                      </p>
                    </div>
                  </div>
                </div>

                {isBankTransferEnabled && (
                  <div
                    className={`p-3 border rounded-lg transition-all ${
                      isLoading
                        ? 'cursor-default bg-gray-50 opacity-75'
                        : 'cursor-pointer hover:bg-gray-50'
                    }`}
                    onClick={() =>
                      !isLoading && setShowBankTransferConfirm(true)
                    }>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center flex-1">
                        <div className="mr-3 text-xl">🏦</div>
                        <div>
                          <h4 className="font-medium">
                            {i18n.t('Bank Transfer')}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {i18n.t(
                              'Pay via bank transfer (1-3 business days)',
                            )}
                          </p>
                        </div>
                      </div>

                      {isLoading && (
                        <div className="flex items-center justify-center pt-1">
                          <Spinner className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      {showBankTransferConfirm && (
        <BankTransferConfirmDialog
          open={showBankTransferConfirm}
          isLoading={isLoading}
          onOpenChange={handleBankTransferDialogOpenChange}
          onCancel={handleBankTransferCancel}
          onConfirm={handleBankTransferConfirm}
        />
      )}
      {showBankDetails && bankTransferDetails && (
        <BankTransferDetails
          open={showBankDetails}
          details={bankTransferDetails}
          onOpenChange={handleBankDetailsDialogClose}
        />
      )}
      <Portal>
        <Spinner show={verifying} fullscreen />
      </Portal>
    </>
  );
}

export default Stripe;
