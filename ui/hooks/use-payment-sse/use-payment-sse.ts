'use client';

import {useEffect, useLayoutEffect, useRef} from 'react';

// ---- CORE IMPORTS ---- //
import {PaymentSource} from '@/lib/core/payment/common/type';
import {PaymentUpdateStatus} from '@/lib/core/payment/sse';

interface UsePaymentSSEOptions {
  source: PaymentSource | undefined;
  entityId: string | number;
  onUpdate: (status: PaymentUpdateStatus) => void;
}

export function usePaymentSSE({
  source,
  entityId,
  onUpdate,
}: UsePaymentSSEOptions) {
  const onUpdateRef = useRef(onUpdate);
  useLayoutEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    if (!entityId || !source) return;

    const url = `/api/payment/sse?source=${source}&entityId=${entityId}`;
    const es = new EventSource(url);

    es.addEventListener('payment', (event: MessageEvent) => {
      es.close();
      const status: PaymentUpdateStatus =
        JSON.parse(event.data)?.status ?? 'success';
      onUpdateRef.current(status);
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
