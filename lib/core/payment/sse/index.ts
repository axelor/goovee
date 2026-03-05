import {PaymentSource} from '@/lib/core/payment/common/type';

type SSEController = ReadableStreamDefaultController<Uint8Array>;

const subscribers = new Map<string, Set<SSEController>>();

function getKey(source: PaymentSource, entityId: string): string {
  return `${source}:${entityId}`;
}

export function subscribe(
  source: PaymentSource,
  entityId: string,
  controller: SSEController,
): void {
  const key = getKey(source, entityId);

  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }

  subscribers.get(key)!.add(controller);
}

export function unsubscribe(
  source: PaymentSource,
  entityId: string,
  controller: SSEController,
): void {
  const key = getKey(source, entityId);
  const set = subscribers.get(key);

  if (!set) return;

  set.delete(controller);

  if (set.size === 0) {
    subscribers.delete(key);
  }
}

export function notifyPaymentUpdate(
  source: PaymentSource,
  entityId: string | number,
): void {
  const key = getKey(source, String(entityId));
  const set = subscribers.get(key);

  if (!set || set.size === 0) {
    return;
  }

  const encoder = new TextEncoder();
  const message = encoder.encode('event: payment\ndata: {}\n\n');

  for (const controller of set) {
    try {
      controller.enqueue(message);
      controller.close();
    } catch {
      // subscriber already closed, skip
    }
  }

  subscribers.delete(key);
}
