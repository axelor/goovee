'use client';

import {useEffect, useLayoutEffect, useRef} from 'react';

// ---- CORE IMPORTS ---- //
import {useTenantScope} from '@/lib/core/url/tenant-context';
import {PaymentSource} from '@/lib/core/payment/common/type';
import {
  PaymentUpdateStatus,
  PAYMENT_UPDATE_STATUS,
} from '@/lib/core/payment/sse/constants';

interface UsePaymentSSEOptions {
  source: PaymentSource | undefined;
  entityId: string;
  contextId: string | undefined;
  onUpdate: (status: PaymentUpdateStatus) => void;
}

export function usePaymentSSE({
  source,
  entityId,
  contextId,
  onUpdate,
}: UsePaymentSSEOptions) {
  /* The stream is one of the tenant's own addresses, and these components only
   * ever render inside its shell, so the scope that builds it is in context. */
  const scope = useTenantScope();

  const onUpdateRef = useRef(onUpdate);
  useLayoutEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    if (!entityId || !source || !contextId) return;

    const url = scope.forBrowser(
      `/api/payment/sse?source=${source}&entityId=${entityId}&contextId=${contextId}`,
    );
    const es = new EventSource(url);

    es.addEventListener('payment', (event: MessageEvent) => {
      const status: PaymentUpdateStatus =
        JSON.parse(event.data)?.status ?? PAYMENT_UPDATE_STATUS.SUCCESS;
      // For partial payments, keep the connection open — more funds may arrive
      if (status !== PAYMENT_UPDATE_STATUS.PARTIAL) {
        es.close();
      }
      onUpdateRef.current(status);
    });

    es.onerror = error => {
      console.error('[SSE][CLIENT] Connection error', {
        source,
        entityId,
        contextId,
        error,
      });
      es.close();
    };

    return () => {
      es.close();
    };
  }, [source, entityId, contextId, scope]);
}

export default usePaymentSSE;
