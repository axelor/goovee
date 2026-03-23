// ---- CORE IMPORTS ---- //
import {HUBPISP_DEFAULT_EXPIRE_IN} from './constants';
import {findAllPendingHubPispContexts} from './orm';
import {pollPaymentRequestStatus} from './poll';
import {pollPaymentLinkStatus} from './pollLink';

function getRemainingExpireIn(createdOn: Date): number | null {
  const elapsedSeconds = (Date.now() - createdOn.getTime()) / 1000;
  const remaining = HUBPISP_DEFAULT_EXPIRE_IN - elapsedSeconds;
  return remaining > 0 ? remaining : null;
}

/**
 * On server startup, resumes background polling for any HUB PISP payment
 * contexts that were still pending when the server last stopped.
 *
 * Two cases are handled:
 * 1. Contexts with a paymentRequestResourceId — the link was PROCESSED before the restart.
 *    Resume pollPaymentRequestStatus to detect the final bank transfer status.
 * 2. Contexts with no paymentRequestResourceId — the server stopped before the link became
 *    PROCESSED. Resume pollPaymentLinkStatus to detect when it does.
 */
export async function resumeHubPispPolling({
  tenantId,
}: {
  tenantId: string;
}): Promise<void> {
  let pendingContexts;
  try {
    pendingContexts = await findAllPendingHubPispContexts({tenantId});
  } catch (err) {
    console.error('[HUBPISP][STARTUP] Failed to query pending contexts', {
      tenantId,
      error: (err as Error).message,
    });
    return;
  }

  if (!pendingContexts.length) {
    console.log('[HUBPISP][STARTUP] No pending contexts to resume', {tenantId});
    return;
  }

  for (const ctx of pendingContexts) {
    if (ctx.paymentRequestResourceId) {
      console.log('[HUBPISP][STARTUP] Resuming payment request poll', {
        contextId: ctx.contextId,
        paymentRequestResourceId: ctx.paymentRequestResourceId,
        localInstrument: ctx.localInstrument,
      });
      pollPaymentRequestStatus({
        paymentRequestResourceId: ctx.paymentRequestResourceId,
        contextId: ctx.contextId,
        tenantId: ctx.tenantId,
        localInstrument: ctx.localInstrument,
      });
    } else {
      const remainingExpireIn = getRemainingExpireIn(ctx.createdOn);
      if (!remainingExpireIn) {
        console.log(
          '[HUBPISP][STARTUP] Payment link already expired, skipping',
          {contextId: ctx.contextId, resourceId: ctx.resourceId},
        );
        continue;
      }
      console.log('[HUBPISP][STARTUP] Resuming payment link poll', {
        contextId: ctx.contextId,
        resourceId: ctx.resourceId,
        localInstrument: ctx.localInstrument,
        remainingExpireIn,
      });
      pollPaymentLinkStatus({
        resourceId: ctx.resourceId,
        contextId: ctx.contextId,
        tenantId: ctx.tenantId,
        localInstrument: ctx.localInstrument,
        expireIn: remainingExpireIn,
      });
    }
  }
}
