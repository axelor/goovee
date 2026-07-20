// ---- CORE IMPORTS ---- //
import {PaymentOption} from '@/types';
import type {Client} from '@/goovee/.generated/client';
import {type PaymentContext} from './type';

export const CONTEXT_STATUS = {
  // -- In flight --
  /** Awaiting gateway confirmation — the only status a saga runner may claim. */
  pending: 'pending',
  /** Claimed by the payment saga — capture confirmed, business tail running. */
  processing: 'processing',
  // -- Terminal: nothing may act on the context anymore.
  processed: 'processed',
  cancelled: 'cancelled',
  failed: 'failed',
  expired: 'expired',
  // -- Terminal failure queues: a human must act on the ERP side.
  /** Money captured, customer got nothing — ERP refund queue. */
  refund_required: 'refund_required',
  /** Money captured and rightfully kept, ERP records incomplete — ERP reconcile queue. */
  reconcile_required: 'reconcile_required',
} as const;

export type ContextStatus =
  (typeof CONTEXT_STATUS)[keyof typeof CONTEXT_STATUS];

export async function createPaymentContext({
  context,
  mode,
  payer,
  client,
}: {
  context: any;
  mode: PaymentOption;
  payer: string;
  client: Client;
}): Promise<{
  id: string;
  version: number;
  data: any;
}> {
  const timeStamp = new Date();

  const payment = await client.paymentContext.create({
    data: {
      mode,
      payer,
      data: context,
      createdOn: timeStamp,
      updatedOn: timeStamp,
      status: CONTEXT_STATUS.pending,
    },
    select: {id: true, version: true, data: true},
  });
  return payment;
}

const CONTEXT_VALIDITY_DURATION = 1000 * 60 * 5; // 5 minutes

export async function findPaymentContext({
  id,
  client,
  mode,
  ignoreExpiration = false,
  ignoreStatus = false,
}: {
  id: string;
  client: Client;
  mode: PaymentOption;
  /**
   * Pass true for long-lived pending instruments (bank transfers, HUB PISP
   * links) that legitimately outlive the default validity window. Default
   * (false) is for validating short-lived sessions (card, PayPal, Paybox),
   * where a stale pending context is auto-marked expired.
   */
  ignoreExpiration?: boolean;
  /**
   * Observer mode: returns the context regardless of status — webhooks and
   * pollers pass true so a redelivery for an already claimed/terminal context
   * can be acknowledged instead of erroring. Callers must then check `status`
   * themselves. Implies ignoreExpiration: an observer never mutates the row.
   */
  ignoreStatus?: boolean;
}): Promise<PaymentContext | null> {
  const context = await client.paymentContext.findOne({
    where: {
      id,
      mode,
      ...(ignoreStatus ? {} : {status: CONTEXT_STATUS.pending}),
    },
    select: {
      id: true,
      version: true,
      data: true,
      createdOn: true,
      mode: true,
      status: true,
      payer: true,
    },
  });

  if (!context) return null;

  if (
    !ignoreExpiration &&
    !ignoreStatus &&
    context.status === CONTEXT_STATUS.pending
  ) {
    if (context.createdOn!.getTime() + CONTEXT_VALIDITY_DURATION < Date.now()) {
      await updatePaymentStatus({
        contextId: context.id,
        version: context.version,
        client,
        status: CONTEXT_STATUS.expired,
      });
      return null;
    }
  }

  return {
    id: context.id,
    version: context.version,
    data: await context.data,
    mode: context.mode as PaymentOption,
    status: context.status as ContextStatus,
    payer: context.payer,
  };
}

export async function updatePaymentContextData({
  id,
  version,
  client,
  context,
}: {
  id: string;
  version: number;
  client: Client;
  context?: any;
}) {
  const result = await client.paymentContext.update({
    data: {
      id,
      version,
      data: Promise.resolve(context),
      updatedOn: new Date(),
    },
    select: {id: true, version: true},
  });

  return result;
}

export function markPaymentAsPending(params: {
  contextId: string;
  version: number;
  client: Client;
}) {
  return updatePaymentStatus({
    ...params,
    status: CONTEXT_STATUS.pending,
  });
}

export function markPaymentAsCancelled(params: {
  contextId: string;
  version: number;
  client: Client;
}) {
  return updatePaymentStatus({
    ...params,
    status: CONTEXT_STATUS.cancelled,
  });
}

export function markPaymentAsFailed(params: {
  contextId: string;
  version: number;
  client: Client;
}) {
  return updatePaymentStatus({
    ...params,
    status: CONTEXT_STATUS.failed,
  });
}

export function markPaymentAsExpired(params: {
  contextId: string;
  version: number;
  client: Client;
}) {
  return updatePaymentStatus({
    ...params,
    status: CONTEXT_STATUS.expired,
  });
}

async function updatePaymentStatus({
  contextId,
  version,
  client,
  status,
}: {
  contextId: string;
  version: number;
  client: Client;
  status: ContextStatus;
}): Promise<void> {
  await client.paymentContext.update({
    data: {
      id: contextId,
      version,
      status,
      updatedOn: new Date(),
    },
    select: {id: true},
  });
}
