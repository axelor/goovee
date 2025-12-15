import {PaymentOption} from '@/types';
import {manager, type Tenant} from '@/tenant';
import type {PaymentContext} from './type';

const CONTEXT_STATUS = {
  pending: 'pending',
  processed: 'processed',
  cancelled: 'cancelled',
};

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
    select: {id: true},
  });
  return payment;
}

const CONTEXT_VALIDITY_DURATION = 1000 * 60 * 5; // 5 minutes
export async function findPaymentContext({
  id,
  tenantId,
  mode,
}: {
  id: string;
  tenantId: Tenant['id'];
  mode: PaymentOption;
}): Promise<PaymentContext | null> {
  const client = await manager.getClient(tenantId);

  if (!client) throw new Error('Client not found');

  const context = await client.paymentContext.findOne({
    where: {
      id,
      mode,
      status: CONTEXT_STATUS.pending,
    },
    select: {data: true, createdOn: true},
  });

  if (!context) return null;

  if (context.createdOn!.getTime() + CONTEXT_VALIDITY_DURATION < Date.now()) {
    return null;
  }

  return {
    id: context.id,
    version: context.version,
    data: await context.data,
  };
}

export async function markPaymentAsProcessed({
  contextId,
  version,
  tenantId,
}: {
  contextId: string;
  version: number;
  tenantId: Tenant['id'];
}): Promise<void> {
  const client = await manager.getClient(tenantId);

  if (!client) throw new Error('Client not found');

  const timeStamp = new Date();
  await client.paymentContext.update({
    data: {
      id: contextId,
      version: version,
      status: CONTEXT_STATUS.processed,
      updatedOn: timeStamp,
    },
    select: {id: true},
  });
}
