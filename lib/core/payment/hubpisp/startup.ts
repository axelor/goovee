// ---- CORE IMPORTS ---- //
import {HUBPISP_DEFAULT_EXPIRE_IN} from './constants';
import {findAllPendingHubPispContexts} from './orm';
import {pollPaymentRequestStatus} from './poll';
import {reconcilePaymentLinkStatus, scheduleLinkExpiryCheck} from './pollLink';
import {manager} from '@/tenant';

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
 *    PROCESSED. Do ONE reconciliation (catch up any webhook missed during downtime) and
 *    re-arm the single expiry backstop for the remaining validity window. The webhook
 *    remains the live driver — we do not resume any polling loop.
 */
export async function resumeHubPispPolling({
  tenantId,
}: {
  tenantId: string;
}): Promise<void> {
  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    console.error('[HUBPISP][STARTUP] Tenant not found', {tenantId});
    return;
  }
  const {client} = tenant;

  let pendingContexts;
  try {
    pendingContexts = await findAllPendingHubPispContexts({client, tenantId});
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
        // Validity window already elapsed during downtime: reconcile once to catch
        // up any missed PROCESSED/EXPIRED. If BPCE still reports the link valid, we
        // leave expiry to BPCE (it pushes EXPIRED via webhook).
        console.log(
          '[HUBPISP][STARTUP] Validity window elapsed, reconciling once',
          {contextId: ctx.contextId, resourceId: ctx.resourceId},
        );
        reconcilePaymentLinkStatus({
          resourceId: ctx.resourceId,
          contextId: ctx.contextId,
          tenantId: ctx.tenantId,
          localInstrument: ctx.localInstrument,
        }).catch(err => {
          console.error('[HUBPISP][STARTUP] Reconciliation failed', {
            contextId: ctx.contextId,
            error: (err as Error).message,
          });
        });
        continue;
      }

      console.log(
        '[HUBPISP][STARTUP] Reconciling link and re-arming expiry check',
        {
          contextId: ctx.contextId,
          resourceId: ctx.resourceId,
          localInstrument: ctx.localInstrument,
          remainingExpireIn,
        },
      );

      // One-shot catch-up for any webhook missed while the server was down.
      reconcilePaymentLinkStatus({
        resourceId: ctx.resourceId,
        contextId: ctx.contextId,
        tenantId: ctx.tenantId,
        localInstrument: ctx.localInstrument,
      }).catch(err => {
        console.error('[HUBPISP][STARTUP] Reconciliation failed', {
          contextId: ctx.contextId,
          error: (err as Error).message,
        });
      });

      // Re-arm the single expiry backstop for the remaining window.
      scheduleLinkExpiryCheck({
        resourceId: ctx.resourceId,
        contextId: ctx.contextId,
        tenantId: ctx.tenantId,
        localInstrument: ctx.localInstrument,
        delaySeconds: remainingExpireIn,
      });
    }
  }
}
