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

  // `paymentContext.data` is a lazy, serialized field: it cannot be filtered
  // with SQL JSON-path operators (they never match its content). So we fetch
  // the pending Stripe contexts using real columns (mode/status) and match on
  // the resolved `data` in JS.
  const candidates = await client.paymentContext.find({
    where: {
      mode: 'stripe',
      status: CONTEXT_STATUS.pending,
    },
    select: {data: true, createdOn: true},
    orderBy: {createdOn: 'DESC'},
  });

  const matched: typeof candidates = [];
  for (const ctx of candidates) {
    const data = (await ctx.data) as {
      id?: string | number | null;
      paymentType?: string | null;
      paymentIntent?: string | null;
    } | null;
    if (
      data?.id != null &&
      String(data.id) === String(id) &&
      data.paymentType === PAYMENT_TYPE.BANK_TRANSFER &&
      data.paymentIntent != null
    ) {
      matched.push(ctx);
    }
  }

  return matched;
}
