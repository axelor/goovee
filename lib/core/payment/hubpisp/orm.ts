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
import type {HubPispLocalInstrument} from '@/lib/core/payment/hubpisp/constants';

export type PendingHubPispContext = {
  contextId: string;
  amount: string;
  initiatedDate: Date;
  localInstrument: HubPispLocalInstrument;
  resourceId: string;
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
    const resourceId = data?.resourceId as string;
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
      localInstrument: data?.localInstrument as HubPispLocalInstrument,
      resourceId,
    });
  }

  return contexts;
}

export type PendingHubPispStartupContext = {
  contextId: string;
  tenantId: string;
  resourceId: string;
  paymentRequestResourceId: string | null;
  localInstrument?: HubPispLocalInstrument;
  createdOn: Date;
};

/**
 * Returns all pending HUB PISP contexts that have a resourceId, used to resume polling on restart.
 * Callers split the result by whether paymentRequestResourceId is set:
 * - set: resume pollPaymentRequestStatus
 * - null: resume pollPaymentLinkStatus
 */
export async function findAllPendingHubPispContexts({
  tenantId,
}: {
  tenantId: string;
}): Promise<PendingHubPispStartupContext[]> {
  const client = await manager.getClient(tenantId);

  const results = await client.paymentContext.find({
    where: {
      mode: PaymentOption.hubpisp,
      status: CONTEXT_STATUS.pending,
      AND: [{data: {path: 'resourceId', ne: null}}],
    },
    select: {
      id: true,
      data: true,
      createdOn: true,
    },
  });

  const resolved = await Promise.all(
    (results || []).map(async ctx => ({...ctx, data: await ctx.data})),
  );
  return resolved
    .map(ctx => ({
      contextId: ctx.id,
      tenantId,
      resourceId: ctx.data?.resourceId as string,
      paymentRequestResourceId:
        (ctx.data?.paymentRequestResourceId as string) ?? null,
      localInstrument: ctx.data?.localInstrument as HubPispLocalInstrument,
      createdOn: ctx.createdOn!,
    }))
    .filter(ctx => Boolean(ctx.resourceId));
}
