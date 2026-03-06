'use client';

import {useEffect, useRef} from 'react';
import {useRouter, usePathname} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {Button} from '@/ui/components';
import {useSearchParams, useToast} from '@/ui/hooks';
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
  successMessage,
  errorMessage,
  cancelMessage,
  skipSuccessToast,
}: Up2payProps) {
  const {toast} = useToast();
  const {searchParams} = useSearchParams();
  const router = useRouter();
  const notifiedRef = useRef(false);
  const pathname = usePathname();

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

    // Show UI feedback based on the redirect status.
    // Actual payment validation (DB update, invoice marking) is handled
    // exclusively by the webhook at /api/webhooks/up2pay — not here.
    if (up2payStatus === UP2PAY_REDIRECT_STATUS.SUCCESS) {
      if (!skipSuccessToast) {
        toast({
          variant: 'success',
          title: i18n.t(successMessage || 'Payment completed successfully'),
        });
      }
    } else if (up2payStatus === UP2PAY_REDIRECT_STATUS.CANCELLED) {
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
    successMessage,
    errorMessage,
    cancelMessage,
    skipSuccessToast,
    pathname,
    router,
    searchParams,
  ]);

  return (
    <Button
      disabled={disabled}
      onClick={handleCreateUp2payOrder}
      className="relative h-[50px] w-full rounded-md overflow-hidden flex items-center justify-center gap-2.5 font-semibold text-white text-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
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
