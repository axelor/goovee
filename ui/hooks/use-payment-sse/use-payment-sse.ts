'use client';

import {useEffect, useRef} from 'react';

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
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!entityId) return;

    const url = `/api/payment/sse?source=${source}&entityId=${entityId}`;
    const es = new EventSource(url);

    es.addEventListener('payment', () => {
      es.close();
      onUpdateRef.current();
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
  }, [source, entityId]);
}

export default usePaymentSSE;
