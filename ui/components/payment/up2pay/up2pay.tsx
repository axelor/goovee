'use client';

import {useEffect, useRef, useState} from 'react';
import {useRouter, usePathname} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {Button} from '@/ui/components';
import {usePaymentSSE, useSearchParams, useToast} from '@/ui/hooks';
import {i18n} from '@/locale';
import {Up2payProps} from '@/ui/components/payment/types';
import {PaymentOption} from '@/types';
import {
  UP2PAY_REDIRECT_STATUS,
  UP2PAY_REDIRECT_PARAMS,
} from '@/payment/up2pay/constants';
import {clearUp2payParams} from '@/payment/up2pay/utils';

export function Up2pay({
  disabled,
  onValidate,
  onCreateOrder,
  errorMessage,
  cancelMessage,
  sse,
}: Up2payProps) {
  const {toast} = useToast();
  const {searchParams} = useSearchParams();
  const router = useRouter();
  const notifiedRef = useRef(false);
  const pathname = usePathname();

  const isSuccessRedirect =
    searchParams.get('status') === UP2PAY_REDIRECT_STATUS.SUCCESS;
  const [sseEnabled, setSseEnabled] = useState(isSuccessRedirect);

  const sseContextKey = sse ? `up2pay_context_id:${sse.entityId}` : null;

  const [contextId, setContextId] = useState<string | undefined>(() => {
    if (!sseContextKey) return undefined;
    return sessionStorage.getItem(sseContextKey) ?? undefined;
  });

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

  const handleCreateUp2payOrder = async (event: any) => {
    event.preventDefault();

    if (onValidate) {
      const isValid = await onValidate(PaymentOption.up2pay);

      if (!isValid) {
        return;
      }
    }

    try {
      const result: any = await onCreateOrder({uri: pathname});

      if (result.error) {
        toast({
          variant: 'destructive',
          title: result.message,
        });
      } else if (result?.order?.url) {
        if (sseContextKey && result.order.contextId) {
          sessionStorage.setItem(sseContextKey, result.order.contextId);
          setContextId(result.order.contextId);
        }
        setSseEnabled(true);
        router.push(result.order.url);
      } else {
        toast({
          variant: 'destructive',
          title: i18n.t('Error processing payment. Try again.'),
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: i18n.t('Unexpected error occurred. Please try again.'),
      });
    }
  };

  const up2payStatus = searchParams.get('status');

  useEffect(() => {
    if (notifiedRef.current || !up2payStatus) {
      return;
    }

    if (!Object.values(UP2PAY_REDIRECT_STATUS).includes(up2payStatus as any)) {
      return;
    }

    notifiedRef.current = true;

    if (up2payStatus === UP2PAY_REDIRECT_STATUS.CANCELLED) {
      toast({
        variant: 'destructive',
        title: i18n.t(cancelMessage || 'Payment cancelled.'),
      });
    } else if (up2payStatus === UP2PAY_REDIRECT_STATUS.REFUSED) {
      toast({
        variant: 'destructive',
        title: i18n.t(errorMessage || 'Payment refused. Please try again.'),
      });
    }

    // Clean all Up2Pay-injected params from the URL so the toast doesn't re-fire on refresh.
    const cleanQuery = clearUp2payParams(searchParams, UP2PAY_REDIRECT_PARAMS);
    router.replace(`${pathname}${cleanQuery ? `?${cleanQuery}` : ''}`);
  }, [
    up2payStatus,
    toast,
    errorMessage,
    cancelMessage,
    pathname,
    router,
    searchParams,
  ]);

  return (
    <Button
      disabled={disabled}
      onClick={handleCreateUp2payOrder}
      className="relative h-[50px] w-full rounded-md overflow-hidden flex items-center justify-center gap-1 font-semibold text-white text-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
      style={{
        background: 'linear-gradient(135deg, #6DC040 0%, #00594C 65%)',
      }}>
      {i18n.t('Pay using')}
      <span className="flex items-baseline leading-none">
        <span style={{color: '#99cc00', fontWeight: 800, fontSize: '1.1rem'}}>
          up
        </span>
        <span style={{color: '#179496', fontWeight: 900, fontSize: '1.35rem'}}>
          2
        </span>
        <span style={{color: '#179496', fontWeight: 800, fontSize: '1.1rem'}}>
          pay
        </span>
      </span>
    </Button>
  );
}

export default Up2pay;
