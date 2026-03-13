// ---- CORE IMPORTS ---- //
import {manager, type Tenant} from '@/tenant';
import {formatNumber} from '@/locale/server/formatters';
import {
  CONTEXT_STATUS,
  markPaymentAsExpired,
} from '@/lib/core/payment/common/orm';
import {fetchPaymentLinkStatus} from '@/lib/core/payment/hubpisp';
import {HUBPISP_CONSENT_STATUS} from '@/lib/core/payment/hubpisp/constants';
import {PaymentOption} from '@/types';

export type PendingHubPispContext = {
  contextId: string;
  amount: string;
  initiatedDate: Date;
};

export async function findPendingHubPispPayments({
  tenantId,
  entityId,
  currencySymbol,
  scale,
}: {
  tenantId: Tenant['id'];
  entityId: string;
  currencySymbol: string;
  scale: number;
}): Promise<PendingHubPispContext[]> {
  if (!entityId) return [];

  const client = await manager.getClient(tenantId);

  const results = await client.paymentContext.find({
    where: {
      mode: PaymentOption.hubpisp,
      status: CONTEXT_STATUS.pending,
      AND: [
        {data: {path: 'id', eq: entityId}},
        {data: {path: 'resourceId', ne: null}},
        {data: {path: 'amount', ne: null}},
      ],
    },
    select: {
      id: true,
      version: true,
      data: true,
      createdOn: true,
    },
    orderBy: {createdOn: 'DESC'},
  });

  const contexts: PendingHubPispContext[] = [];

  const resolvedResults = await Promise.all(
    (results || []).map(async ctx => ({
      ...ctx,
      data: await ctx.data,
    })),
  );

  for (const ctx of resolvedResults) {
    const data = ctx.data;
    const resourceId = data?.resourceId as string | undefined;
    const amount = data?.amount as string | undefined;
    if (!resourceId || !amount) continue;

    try {
      const linkStatus = await fetchPaymentLinkStatus(resourceId);
      const consentStatus = linkStatus?.consentStatus;

      if (consentStatus === HUBPISP_CONSENT_STATUS.EXPIRED) {
        await markPaymentAsExpired({
          contextId: ctx.id,
          version: ctx.version!,
          tenantId,
        });
        continue;
      }
    } catch {
      // If the API call fails, still show the entry using DB data
    }

    const rawAmount = Number(amount);
    const formattedAmount = String(
      await formatNumber(rawAmount, {
        scale,
        currency: String(currencySymbol),
        type: 'DECIMAL',
      }),
    );

    contexts.push({
      contextId: ctx.id,
      amount: formattedAmount,
      initiatedDate: ctx.createdOn!,
    });
  }

  return contexts;
}
