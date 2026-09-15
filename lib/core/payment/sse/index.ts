import {PaymentSource} from '@/payment/common/type';
import {processWide} from '@/runtime/process-wide';
import {PAYMENT_UPDATE_STATUS, type PaymentUpdateStatus} from './constants';

export {PAYMENT_UPDATE_STATUS};
export type {PaymentUpdateStatus};

type SSEController = ReadableStreamDefaultController<Uint8Array>;

/* One set of subscribers for the process: a payment update must reach the
 * stream that subscribed to it whichever module graph delivers the update. */
const subscribers = processWide(
  'payment/sse-subscribers',
  () => new Map<string, Set<SSEController>>(),
);

function getKey(
  tenant: string,
  source: PaymentSource,
  entityId: string,
  contextId: string,
): string {
  return `${tenant}:${source}:${entityId}:${contextId}`;
}

export function subscribe(
  tenant: string,
  source: PaymentSource,
  entityId: string,
  contextId: string,
  controller: SSEController,
): void {
  const key = getKey(tenant, source, entityId, contextId);

  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }

  subscribers.get(key)!.add(controller);
}

export function unsubscribe(
  tenant: string,
  source: PaymentSource,
  entityId: string,
  contextId: string,
  controller: SSEController,
): void {
  const key = getKey(tenant, source, entityId, contextId);
  const set = subscribers.get(key);

  if (!set) return;

  set.delete(controller);

  if (set.size === 0) {
    subscribers.delete(key);
  }
}

export function notifyPaymentUpdate(
  tenant: string,
  source: PaymentSource,
  entityId: string,
  contextId: string,
  status: PaymentUpdateStatus = PAYMENT_UPDATE_STATUS.SUCCESS,
): void {
  const key = getKey(tenant, source, String(entityId), contextId);
  const set = subscribers.get(key);

  if (!set || set.size === 0) {
    return;
  }

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
      // subscriber already closed, skip
    }
  }

  if (isTerminal) {
    subscribers.delete(key);
  }
}
