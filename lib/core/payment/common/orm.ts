// ---- CORE IMPORTS ---- //
import {PaymentOption} from '@/types';
import type {Client} from '@/goovee/.generated/client';
import type {PaymentContext} from './type';

export const CONTEXT_STATUS = {
  pending: 'pending',
  processed: 'processed',
  cancelled: 'cancelled',
  failed: 'failed',
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
    select: {id: true, data: true},
  });
  return payment;
}

const CONTEXT_VALIDITY_DURATION = 1000 * 60 * 5; // 5 minutes

export async function findPaymentContext({
  id,
  client,
  mode,
  ignoreExpiration = false,
}: {
  id: string;
  client: Client;
  mode: PaymentOption;
  ignoreExpiration?: boolean;
}): Promise<PaymentContext | null> {

  const context = await client.paymentContext.findOne({
    where: {
      id,
      mode,
      status: CONTEXT_STATUS.pending,
    },
    select: {data: true, createdOn: true, mode: true, status: true},
  });

  if (!context) return null;

  if (!ignoreExpiration) {
    if (context.createdOn!.getTime() + CONTEXT_VALIDITY_DURATION < Date.now()) {
      return null;
    }
  }

  return {
    id: context.id,
    version: context.version,
    data: await context.data,
    mode: context.mode as PaymentOption,
    status: context.status as ContextStatus,
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
    select: {id: true},
  });

  return result;
}

export function markPaymentAsProcessed(params: {
  contextId: string;
  version: number;
  client: Client;
}) {
  return updatePaymentStatus({
    ...params,
    status: CONTEXT_STATUS.processed,
  });
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
