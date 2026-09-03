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
