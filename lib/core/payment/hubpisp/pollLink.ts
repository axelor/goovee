import {PaymentOption} from '@/types';

// ---- CORE IMPORTS ---- //
import {
  CONTEXT_STATUS,
  findPaymentContext,
  markPaymentAsExpired,
  updatePaymentContextData,
} from '../common/orm';
import {getPaymentLinkStatus} from '.';
import {HUBPISP_CONSENT_STATUS} from './constants';
import type {HubPispLocalInstrument} from './constants';
import {pollPaymentRequestStatus} from './poll';

const POLL_LINK_INTERVAL = 30_000; // 30s

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fallback poller for the payment link status.
 * Started fire-and-forget after createPaymentLink so that if the webhook
 * is never triggered, we still detect when the link becomes PROCESSED and
 * can hand off to pollPaymentRequestStatus.
 *
 * The webhook remains the fast path — when it fires first it will store
 * paymentRequestResourceId and start the payment request poll. This poller
 * will then find the context already in a terminal state and exit immediately.
 */
export async function pollPaymentLinkStatus({
  resourceId,
  contextId,
  tenantId,
  localInstrument,
  expireIn,
}: {
  resourceId: string;
  contextId: string;
  tenantId: string;
  localInstrument?: HubPispLocalInstrument;
  expireIn: number;
}): Promise<void> {
  const deadline = Date.now() + expireIn * 1000;

  console.log('[HUBPISP][POLL_LINK] Starting fallback payment link poll', {
    resourceId,
    contextId,
    expireIn,
  });

  while (Date.now() < deadline) {
    await sleep(POLL_LINK_INTERVAL);

    const paymentContext = await findPaymentContext({
      id: contextId,
      tenantId,
      mode: PaymentOption.hubpisp,
      ignoreExpiration: true,
    });

    if (!paymentContext) {
      console.warn(
        '[HUBPISP][POLL_LINK] Payment context not found, stopping poll',
        {contextId},
      );
      return;
    }

    // Webhook already handled it — nothing left to do
    if (paymentContext.status !== CONTEXT_STATUS.pending) {
      console.log(
        '[HUBPISP][POLL_LINK] Context no longer pending, stopping poll',
        {contextId, status: paymentContext.status},
      );
      return;
    }

    // Webhook stored paymentRequestResourceId — payment request poll is running
    if (paymentContext.data?.paymentRequestResourceId) {
      console.log(
        '[HUBPISP][POLL_LINK] paymentRequestResourceId already set, stopping link poll',
        {contextId},
      );
      return;
    }

    let linkStatusResult: Awaited<ReturnType<typeof getPaymentLinkStatus>>;
    try {
      linkStatusResult = await getPaymentLinkStatus(resourceId);
    } catch (err) {
      console.error(
        '[HUBPISP][POLL_LINK] Failed to fetch payment link status',
        {resourceId, error: (err as Error).message},
      );
      continue;
    }

    if (linkStatusResult.consentStatus === HUBPISP_CONSENT_STATUS.EXPIRED) {
      console.warn('[HUBPISP][POLL_LINK] Payment link expired', {resourceId});
      await markPaymentAsExpired({
        contextId: paymentContext.id,
        version: paymentContext.version,
        tenantId,
      });
      return;
    }

    if (linkStatusResult.consentStatus !== HUBPISP_CONSENT_STATUS.PROCESSED) {
      console.log('[HUBPISP][POLL_LINK] Link not yet processed, continuing', {
        contextId,
        consentStatus: linkStatusResult.consentStatus,
      });
      continue;
    }

    const paymentRequestResourceId =
      linkStatusResult.data.paymentRequestResourceId;

    if (!paymentRequestResourceId) {
      console.warn(
        '[HUBPISP][POLL_LINK] Link PROCESSED but missing paymentRequestResourceId',
        {contextId},
      );
      continue;
    }

    console.log(
      '[HUBPISP][POLL_LINK] Link PROCESSED, handing off to payment request poll',
      {contextId, paymentRequestResourceId},
    );

    await updatePaymentContextData({
      id: paymentContext.id,
      version: paymentContext.version,
      tenantId,
      context: {...paymentContext.data, paymentRequestResourceId},
    });

    pollPaymentRequestStatus({
      paymentRequestResourceId,
      contextId: paymentContext.id,
      tenantId,
      localInstrument,
    });

    return;
  }

  console.warn(
    '[HUBPISP][POLL_LINK] Deadline reached without PROCESSED state, marking expired',
    {contextId, resourceId},
  );

  const paymentContext = await findPaymentContext({
    id: contextId,
    tenantId,
    mode: PaymentOption.hubpisp,
    ignoreExpiration: true,
  });
  if (paymentContext?.status === CONTEXT_STATUS.pending) {
    await markPaymentAsExpired({
      contextId: paymentContext.id,
      version: paymentContext.version,
      tenantId,
    });
  }
}
