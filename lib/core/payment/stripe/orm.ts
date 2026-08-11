import type {Client} from '@/goovee/.generated/client';
import {CONTEXT_STATUS} from '@/lib/core/payment/common/orm';
import {PAYMENT_TYPE} from '@/lib/core/payment/common/type';

export async function findPendingStripeBankTransfers({
  client,
  id,
}: {
  client: Client;
  id: string;
}) {
  if (!id) return null;

  const result = await client.paymentContext.find({
    where: {
      mode: 'stripe',
      status: CONTEXT_STATUS.pending,
      AND: [
        /* data.id is stored as a JSON string; without an explicit type the ORM infers Int for numeric-looking values and the jsonpath never matches. */
        {data: {path: 'id', eq: id, type: 'String'}},
        {data: {path: 'paymentType', eq: PAYMENT_TYPE.BANK_TRANSFER}},
        {data: {path: 'paymentIntent', ne: null}},
      ],
    },
    select: {data: true, createdOn: true},
    orderBy: {createdOn: 'DESC'},
  });

  return result;
}
