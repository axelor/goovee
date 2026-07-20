import {PaymentSource} from '@/lib/core/payment/common/type';
import {PAYMENT_UPDATE_STATUS, type PaymentUpdateStatus} from './constants';

export {PAYMENT_UPDATE_STATUS};
export type {PaymentUpdateStatus};

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

export function notifyPaymentUpdate(
  source: PaymentSource,
  entityId: string,
  contextId: string,
  status: PaymentUpdateStatus = PAYMENT_UPDATE_STATUS.SUCCESS,
): void {
  const key = getKey(source, String(entityId), contextId);
  const set = subscribers.get(key);

  if (!set || set.size === 0) {
    console.log('[SSE] No subscribers for payment update', {key, status});
    return;
  }

  console.log('[SSE] Notifying payment update', {
    key,
    status,
    subscriberCount: set.size,
  });

  const encoder = new TextEncoder();
  const message = encoder.encode(
    `event: payment\ndata: ${JSON.stringify({status})}\n\n`,
  );

  const isTerminal = status !== PAYMENT_UPDATE_STATUS.PARTIAL;

  for (const controller of set) {
    try {
      controller.enqueue(message);
      if (isTerminal) controller.close();
    } catch {
      console.error('[SSE] Failed to notify subscriber, already closed', {
        key,
        status,
      });
    }
  }

  if (isTerminal) {
    subscribers.delete(key);
  }
}
