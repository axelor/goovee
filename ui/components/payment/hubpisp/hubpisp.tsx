'use client';

import {useEffect, useRef, useState} from 'react';
import {useRouter, usePathname} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@/ui/components';
import {usePaymentSSE, useSearchParams, useToast} from '@/ui/hooks';
import {i18n} from '@/locale';
import {HubPispProps} from '@/ui/components/payment/types';
import {PaymentOption} from '@/types';
import {
  HUBPISP_LOCAL_INSTRUMENT,
  HUBPISP_REDIRECT_STATUS,
  HubPispLocalInstrument,
} from '@/payment/hubpisp/constants';

export function HubPISP({
  disabled,
  onValidate,
  onCreateOrder,
  errorMessage,
  cancelMessage,
  sse,
}: HubPispProps) {
  const [showTransferOptions, setShowTransferOptions] = useState(false);
  const [loadingInstrument, setLoadingInstrument] =
    useState<HubPispLocalInstrument | null>(null);
  const isLoading = loadingInstrument !== null;

  const notifiedRef = useRef(false);

  const {toast} = useToast();
  const {searchParams} = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const hubpispStatus = searchParams.get('hubpisp_status');

  const sseContextKey = sse ? `hubpisp_context_id:${sse.entityId}` : null;

  const [contextId, setContextId] = useState<string | undefined>(() => {
    if (!sseContextKey) return undefined;
    return sessionStorage.getItem(sseContextKey) ?? undefined;
  });

  const [sseEnabled, setSseEnabled] = useState(
    () =>
      hubpispStatus === HUBPISP_REDIRECT_STATUS.SUCCESS ||
      hubpispStatus === HUBPISP_REDIRECT_STATUS.CANCELLED ||
      (sseContextKey !== null &&
        sessionStorage.getItem(sseContextKey) !== null),
  );

  usePaymentSSE({
    source: sse && sseEnabled ? sse.source : undefined,
    entityId: sse && sseEnabled ? sse.entityId : '',
    contextId: sseEnabled ? contextId : undefined,
    onUpdate:
      sse && sseEnabled
        ? status => {
            if (sseContextKey) sessionStorage.removeItem(sseContextKey);
            sse.onPaymentUpdate(status);
          }
        : () => {},
  });

  const handlePaymentClick = async (event: React.MouseEvent) => {
    event.preventDefault();

    if (onValidate) {
      const isValid = await onValidate(PaymentOption.hubpisp);
      if (!isValid) return;
    }

    setShowTransferOptions(true);
  };

  const handleInitiatePispPayment = async (
    localInstrument?: HubPispLocalInstrument,
  ) => {
    setLoadingInstrument(localInstrument ?? HUBPISP_LOCAL_INSTRUMENT.SCT);

    try {
      const result = await onCreateOrder({
        uri: pathname,
        localInstrument,
      });

      if (result.error) {
        toast({
          variant: 'destructive',
          title: result.message,
        });
      } else if (result?.order?.consentHref) {
        if (sseContextKey && result.order.contextId) {
          sessionStorage.setItem(sseContextKey, result.order.contextId);
          setContextId(result.order.contextId);
        }
        setSseEnabled(true);
        router.push(result.order.consentHref);
      } else {
        console.error(
          '[HubPISP]',
          'Unexpected result shape — no consentHref',
          result,
        );
        toast({
          variant: 'destructive',
          title: i18n.t('Error processing payment. Try again.'),
        });
      }
    } catch (err) {
      console.error('[HubPISP]', 'Unexpected error', err);
      toast({
        variant: 'destructive',
        title: i18n.t('Unexpected error occurred. Please try again.'),
      });
    } finally {
      setLoadingInstrument(null);
    }
  };

  useEffect(() => {
    if (!hubpispStatus) return;

    if (notifiedRef.current) {
      return;
    }

    if (
      !Object.values(HUBPISP_REDIRECT_STATUS).includes(
        hubpispStatus as (typeof HUBPISP_REDIRECT_STATUS)[keyof typeof HUBPISP_REDIRECT_STATUS],
      )
    ) {
      return;
    }

    notifiedRef.current = true;

    if (hubpispStatus === HUBPISP_REDIRECT_STATUS.CANCELLED) {
      toast({
        variant: 'destructive',
        title: i18n.t(cancelMessage || 'Payment cancelled.'),
      });
    } else if (hubpispStatus === HUBPISP_REDIRECT_STATUS.EXPIRED) {
      toast({
        variant: 'destructive',
        title: i18n.t(
          errorMessage || 'Payment link expired. Please try again.',
        ),
      });
    }

    const cleanParams = new URLSearchParams(searchParams.toString());
    cleanParams.delete('hubpisp_status');
    const cleanQuery = cleanParams.toString();
    router.replace(`${pathname}${cleanQuery ? `?${cleanQuery}` : ''}`);
  }, [
    hubpispStatus,
    toast,
    errorMessage,
    cancelMessage,
    pathname,
    router,
    searchParams,
  ]);

  return (
    <>
      <Button
        disabled={disabled}
        onClick={handlePaymentClick}
        className="relative h-[50px] w-full rounded-md overflow-hidden flex items-center justify-center font-semibold text-white text-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
        style={{
          background:
            'linear-gradient(135deg, #3d0066 0%, #6b0099 50%, #e0007a 100%)',
        }}>
        {i18n.t('Pay using HUB PISP')}
      </Button>

      <Dialog
        open={showTransferOptions}
        onOpenChange={() => !isLoading && setShowTransferOptions(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium mb-4">
              {i18n.t('Select Transfer Type (HUB PISP)')}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 p-4 border rounded-lg">
                <div
                  className={`p-3 border rounded-lg transition-all ${
                    isLoading
                      ? 'cursor-default bg-gray-50 opacity-75'
                      : 'cursor-pointer hover:bg-gray-50'
                  }`}
                  onClick={() =>
                    !isLoading &&
                    handleInitiatePispPayment(HUBPISP_LOCAL_INSTRUMENT.INST)
                  }>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center flex-1">
                      <div className="mr-3 text-xl">⚡</div>
                      <div>
                        <h4 className="font-medium">
                          {i18n.t('Instant transfer (SCTInst)')}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {i18n.t('Within seconds')}
                        </p>
                      </div>
                    </div>

                    {loadingInstrument === HUBPISP_LOCAL_INSTRUMENT.INST && (
                      <div className="flex items-center justify-center pt-1">
                        <Spinner className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`p-3 border rounded-lg transition-all ${
                    isLoading
                      ? 'cursor-default bg-gray-50 opacity-75'
                      : 'cursor-pointer hover:bg-gray-50'
                  }`}
                  onClick={() => !isLoading && handleInitiatePispPayment()}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center flex-1">
                      <div className="mr-3 text-xl">🏦</div>
                      <div>
                        <h4 className="font-medium">
                          {i18n.t('Standard transfer (SCT)')}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {i18n.t('1-3 business days')}
                        </p>
                      </div>
                    </div>

                    {loadingInstrument === HUBPISP_LOCAL_INSTRUMENT.SCT && (
                      <div className="flex items-center justify-center pt-1">
                        <Spinner className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default HubPISP;
