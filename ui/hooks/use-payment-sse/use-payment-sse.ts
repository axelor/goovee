'use client';

import {useEffect, useLayoutEffect, useRef} from 'react';

// ---- CORE IMPORTS ---- //
import {PaymentSource} from '@/lib/core/payment/common/type';
import {PaymentUpdateStatus} from '@/lib/core/payment/sse';

interface UsePaymentSSEOptions {
  source: PaymentSource | undefined;
  entityId: string | number;
  contextId: string | undefined;
  onUpdate: (status: PaymentUpdateStatus) => void;
}

export function usePaymentSSE({
  source,
  entityId,
  contextId,
  onUpdate,
}: UsePaymentSSEOptions) {
  const onUpdateRef = useRef(onUpdate);
  useLayoutEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    if (!entityId || !source || !contextId) return;

    const url = `/api/payment/sse?source=${source}&entityId=${entityId}&contextId=${contextId}`;
    const es = new EventSource(url);

    es.addEventListener('payment', (event: MessageEvent) => {
      const status: PaymentUpdateStatus =
        JSON.parse(event.data)?.status ?? 'success';
      es.close();
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
  }, [source, entityId, contextId]);
}

export default usePaymentSSE;
