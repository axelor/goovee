// ---- CORE IMPORTS ---- //
import {PaymentOption} from '@/types';
import {manager, type Tenant} from '@/tenant';
import {type PaymentContext} from './type';

export const CONTEXT_STATUS = {
  pending: 'pending',
  processed: 'processed',
  cancelled: 'cancelled',
  failed: 'failed',
  expired: 'expired',
} as const;

export type ContextStatus =
  (typeof CONTEXT_STATUS)[keyof typeof CONTEXT_STATUS];

export async function createPaymentContext({
  context,
  mode,
  payer,
  tenantId,
}: {
  context: any;
  mode: PaymentOption;
  payer: string;
  tenantId: Tenant['id'];
}): Promise<{
  id: string;
  version: number;
  data: any;
}> {
  const client = await manager.getClient(tenantId);

  if (!client) throw new Error('Client not found');
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
  tenantId,
  mode,
  ignoreExpiration = false,
}: {
  id: string;
  tenantId: Tenant['id'];
  mode: PaymentOption;
  ignoreExpiration?: boolean;
}): Promise<PaymentContext | null> {
  const client = await manager.getClient(tenantId);

  if (!client) throw new Error('Client not found');

  const context = await client.paymentContext.findOne({
    where: {
      id,
      mode,
      status: CONTEXT_STATUS.pending,
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

  if (!ignoreExpiration) {
    if (context.createdOn!.getTime() + CONTEXT_VALIDITY_DURATION < Date.now()) {
      await updatePaymentStatus({
        contextId: context.id,
        version: context.version,
        tenantId,
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
  tenantId,
  context,
}: {
  id: string;
  version: number;
  tenantId: Tenant['id'];
  context?: any;
}) {
  const client = await manager.getClient(tenantId);
  if (!client) throw new Error('Client not found');

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
  tenantId: Tenant['id'];
}) {
  return updatePaymentStatus({
    ...params,
    status: CONTEXT_STATUS.processed,
  });
}

export function markPaymentAsPending(params: {
  contextId: string;
  version: number;
  tenantId: Tenant['id'];
}) {
  return updatePaymentStatus({
    ...params,
    status: CONTEXT_STATUS.pending,
  });
}

export function markPaymentAsCancelled(params: {
  contextId: string;
  version: number;
  tenantId: Tenant['id'];
}) {
  return updatePaymentStatus({
    ...params,
    status: CONTEXT_STATUS.cancelled,
  });
}

export function markPaymentAsFailed(params: {
  contextId: string;
  version: number;
  tenantId: Tenant['id'];
}) {
  return updatePaymentStatus({
    ...params,
    status: CONTEXT_STATUS.failed,
  });
}

export function markPaymentAsExpired(params: {
  contextId: string;
  version: number;
  tenantId: Tenant['id'];
}) {
  return updatePaymentStatus({
    ...params,
    status: CONTEXT_STATUS.expired,
  });
}

async function updatePaymentStatus({
  contextId,
  version,
  tenantId,
  status,
}: {
  contextId: string;
  version: number;
  tenantId: Tenant['id'];
  status: ContextStatus;
}): Promise<void> {
  const client = await manager.getClient(tenantId);
  if (!client) throw new Error('Client not found');

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
