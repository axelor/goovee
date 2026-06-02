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
import {manager} from '@/tenant';

// Tracks scheduled expiry checks to avoid duplicate timers for the same link.
const scheduledExpiryChecks = new Set<string>();

// Buffer added after the expiry instant so BPCE has flipped the link to EXPIRED.
const EXPIRY_CHECK_BUFFER_MS = 5_000;

/**
 * One-shot reconciliation of a payment link (a SINGLE GET, never a loop).
 * Used as a restart catch-up and the expiry backstop; the webhook is the live driver.
 *
 *   - PROCESSED          → store paymentRequestResourceId + start the payment request poll
 *   - EXPIRED            → mark the context expired
 *   - PENDING / EXECUTED → no-op (BPCE still considers the link valid; expiry is left
 *                          to BPCE, which pushes EXPIRED via webhook)
 */
export async function reconcilePaymentLinkStatus({
  resourceId,
  contextId,
  tenantId,
  localInstrument,
}: {
  resourceId: string;
  contextId: string;
  tenantId: string;
  localInstrument?: HubPispLocalInstrument;
}): Promise<void> {
  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    console.error('[HUBPISP][RECONCILE_LINK] Tenant not found', {
      tenantId,
      contextId,
    });
    return;
  }
  const {client} = tenant;

  const paymentContext = await findPaymentContext({
    id: contextId,
    client,
    mode: PaymentOption.hubpisp,
    ignoreExpiration: true,
  });

  if (!paymentContext) {
    console.warn('[HUBPISP][RECONCILE_LINK] Payment context not found', {
      contextId,
    });
    return;
  }

  // Webhook already moved it out of pending — nothing to do.
  if (paymentContext.status !== CONTEXT_STATUS.pending) {
    return;
  }

  // Webhook already stored the payment request id — the payment request poll owns it.
  if (paymentContext.data?.paymentRequestResourceId) {
    return;
  }

  let linkStatusResult: Awaited<ReturnType<typeof getPaymentLinkStatus>>;
  try {
    linkStatusResult = await getPaymentLinkStatus(resourceId);
  } catch (err) {
    console.error(
      '[HUBPISP][RECONCILE_LINK] Failed to fetch payment link status',
      {
        resourceId,
        error: (err as Error).message,
      },
    );
    return;
  }

  if (linkStatusResult.consentStatus === HUBPISP_CONSENT_STATUS.EXPIRED) {
    console.warn('[HUBPISP][RECONCILE_LINK] Payment link expired', {
      resourceId,
    });
    await markPaymentAsExpired({
      contextId: paymentContext.id,
      version: paymentContext.version,
      client,
    });
    return;
  }

  if (linkStatusResult.consentStatus !== HUBPISP_CONSENT_STATUS.PROCESSED) {
    // PENDING / EXECUTED — BPCE still considers the link valid, so we don't expire
    // it on our local clock. BPCE is authoritative for expiry and pushes EXPIRED
    // via the webhook (this reconcile GET already catches a missed EXPIRED above).
    return;
  }

  const paymentRequestResourceId =
    linkStatusResult.data.paymentRequestResourceId;
  if (!paymentRequestResourceId) {
    console.warn(
      '[HUBPISP][RECONCILE_LINK] Link PROCESSED but missing paymentRequestResourceId',
      {contextId},
    );
    return;
  }

  console.log(
    '[HUBPISP][RECONCILE_LINK] Link PROCESSED, handing off to payment request poll',
    {contextId, paymentRequestResourceId},
  );

  await updatePaymentContextData({
    id: paymentContext.id,
    version: paymentContext.version,
    client,
    context: {...paymentContext.data, paymentRequestResourceId},
  });

  pollPaymentRequestStatus({
    paymentRequestResourceId,
    contextId: paymentContext.id,
    tenantId,
    localInstrument,
  });
}

/**
 * Schedules a SINGLE expiry check `delaySeconds` from now.
 *
 * Why: the BPCE webhook is the primary driver of link state, but a notification can
 * be missed. Without this, a payment whose EXPIRED/PROCESSED webhook never arrives
 * would stay `pending` forever (the generic context expiry doesn't apply to HUB PISP).
 * This timer normally no-ops; it only fires one GET at the link's expiry instant to
 * resolve such a payment. If BPCE still reports the link valid (PENDING/EXECUTED) we
 * leave expiry to BPCE. (§4.3.3 recommends keeping such a check, not trusting the
 * webhook alone.)
 *
 * Replaces the old 30s polling loop. In-process timer (single-server / in-memory
 * model); startup.ts re-arms it for the remaining window after a restart.
 */
export function scheduleLinkExpiryCheck({
  resourceId,
  contextId,
  tenantId,
  localInstrument,
  delaySeconds,
}: {
  resourceId: string;
  contextId: string;
  tenantId: string;
  localInstrument?: HubPispLocalInstrument;
  delaySeconds: number;
}): void {
  if (scheduledExpiryChecks.has(resourceId)) {
    return;
  }
  if (delaySeconds <= 0) {
    return;
  }

  scheduledExpiryChecks.add(resourceId);

  console.log('[HUBPISP][EXPIRY_CHECK] Scheduling expiry backstop', {
    resourceId,
    contextId,
    delaySeconds,
  });

  const timer = setTimeout(
    () => {
      scheduledExpiryChecks.delete(resourceId);
      reconcilePaymentLinkStatus({
        resourceId,
        contextId,
        tenantId,
        localInstrument,
      }).catch(err => {
        console.error('[HUBPISP][EXPIRY_CHECK] Reconciliation failed', {
          resourceId,
          contextId,
          error: (err as Error).message,
        });
      });
    },
    delaySeconds * 1000 + EXPIRY_CHECK_BUFFER_MS,
  );

  // Don't keep the process alive solely for this timer.
  (timer as {unref?: () => void}).unref?.();
}
