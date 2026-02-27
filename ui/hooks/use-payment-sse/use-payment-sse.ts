'use client';

import {useEffect} from 'react';

// ---- CORE IMPORTS ---- //
import {PaymentSource} from '@/lib/core/payment/common/type';

interface UsePaymentSSEOptions {
  source: PaymentSource;
  entityId: string | number;
  onUpdate: () => void;
}

export function usePaymentSSE({
  source,
  entityId,
  onUpdate,
}: UsePaymentSSEOptions) {
  useEffect(() => {
    if (!entityId) return;

    const url = `/api/payment/sse?source=${source}&entityId=${entityId}`;
    const es = new EventSource(url);

    es.addEventListener('payment', () => {
      es.close();
      onUpdate();
    });

    es.onerror = error => {
      console.error('[SSE][CLIENT] Connection error', {
        source,
        entityId,
        error,
      });
      es.close();
    };

    return () => {
      es.close();
    };
  }, [source, entityId, onUpdate]);
}

export default usePaymentSSE;
