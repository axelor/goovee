import {manager, type Tenant} from '@/tenant';
import {CONTEXT_STATUS} from '@/lib/core/payment/common/orm';
import {PAYMENT_TYPE} from '@/lib/core/payment/common/type';

export async function findPendingStripeBankTransfers({
  tenantId,
  id,
}: {
  tenantId: Tenant['id'];
  id: string;
}) {
  if (!id || !tenantId) return null;

  const client = await manager.getClient(tenantId);

  const result = await client.paymentContext.find({
    where: {
      mode: 'stripe',
      status: CONTEXT_STATUS.pending,
      AND: [
        {data: {path: 'id', eq: id}},
        {data: {path: 'paymentType', eq: PAYMENT_TYPE.BANK_TRANSFER}},
        {data: {path: 'paymentIntent', ne: null}},
      ],
    },
    select: {data: true, createdOn: true},
    orderBy: {createdOn: 'DESC'},
  });

  return result;
}
