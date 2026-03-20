// ---- CORE IMPORTS ---- //
import {findAllPendingHubPispContexts} from './orm';
import {pollPaymentRequestStatus} from './poll';

/**
 * On server startup, resumes background polling for any HUB PISP payment
 * contexts that were still pending when the server last stopped.
 *
 * This covers the server-restart edge case: if a poll was running during a
 * restart (especially relevant for SCT payments with a 24h polling window),
 * the in-memory loop is lost. This function re-queues all contexts that have
 * a paymentRequestResourceId but haven't reached a terminal state yet.
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
    console.log('[HUBPISP][STARTUP] Resuming poll', {
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
  }
}
