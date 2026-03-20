import {PaymentSource} from '@/lib/core/payment/common/type';

type SSEController = ReadableStreamDefaultController<Uint8Array>;

// Use global to survive module re-instantiation under Turbopack / HMR
declare global {
  // eslint-disable-next-line no-var
  var __sseSubscribers: Map<string, Set<SSEController>> | undefined;
}

if (!global.__sseSubscribers) {
  global.__sseSubscribers = new Map();
}

const subscribers = global.__sseSubscribers;

function getKey(
  source: PaymentSource,
  entityId: string,
  contextId: string,
): string {
  return `${source}:${entityId}:${contextId}`;
}

export function subscribe(
  source: PaymentSource,
  entityId: string,
  contextId: string,
  controller: SSEController,
): void {
  const key = getKey(source, entityId, contextId);

  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }

  subscribers.get(key)!.add(controller);
}

export function unsubscribe(
  source: PaymentSource,
  entityId: string,
  contextId: string,
  controller: SSEController,
): void {
  const key = getKey(source, entityId, contextId);
  const set = subscribers.get(key);

  if (!set) return;

  set.delete(controller);

  if (set.size === 0) {
    subscribers.delete(key);
  }
}

export type PaymentUpdateStatus = 'success' | 'failed' | 'cancelled';

export function notifyPaymentUpdate(
  source: PaymentSource,
  entityId: string | number,
  contextId: string,
  status: PaymentUpdateStatus = 'success',
): void {
  const key = getKey(source, String(entityId), contextId);
  const set = subscribers.get(key);

  if (!set || set.size === 0) {
    return;
  }

  const encoder = new TextEncoder();
  const message = encoder.encode(
    `event: payment\ndata: ${JSON.stringify({status})}\n\n`,
  );

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
