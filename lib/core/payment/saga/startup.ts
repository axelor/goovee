// ---- CORE IMPORTS ---- //
import {manager} from '@/tenant';
import {SAGA_FAILURE_STATUS} from '@/lib/core/saga';
import {CONTEXT_STATUS} from '../common/orm';

// ---- LOCAL IMPORTS ---- //
import {recordPaymentIncident} from './incident';

const RESTART_FAILURE_REASON = 'Interrupted by server restart';

/**
 * On server startup, flags payment contexts left in `processing` by a crash
 * mid-saga. They are moved to the reconcile queue — NEVER re-executed: the
 * interrupted step may or may not have reached the ERP (same ambiguity as a
 * timeout), so only a human looking at the actual ERP records can resolve it.
 */
export async function sweepInterruptedPaymentSagas({
  tenantId,
}: {
  tenantId: string;
}): Promise<void> {
  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    console.error('[PAYMENT-SAGA][STARTUP] Tenant not found', {tenantId});
    return;
  }
  const {client} = tenant;

  let stuck;
  try {
    stuck = await client.paymentContext.find({
      where: {status: CONTEXT_STATUS.processing},
      select: {id: true, version: true, data: true, payer: true, mode: true},
    });
  } catch (err) {
    console.error('[PAYMENT-SAGA][STARTUP] Failed to query stuck contexts', {
      tenantId,
      error: (err as Error).message,
    });
    return;
  }

  if (!stuck.length) {
    console.log('[PAYMENT-SAGA][STARTUP] No interrupted payment sagas', {
      tenantId,
    });
    return;
  }

  for (const context of stuck) {
    try {
      const data = (await context.data) as any;
      const step = data?.saga?.step;
      const failureReason = step
        ? `${RESTART_FAILURE_REASON} at step ${step}`
        : RESTART_FAILURE_REASON;

      await client.paymentContext.update({
        data: {
          id: context.id,
          version: context.version,
          status: CONTEXT_STATUS.reconcile_required,
          failureReason,
          updatedOn: new Date(),
        },
        select: {id: true},
      });

      /* Interruptions always land in the reconcile queue (the request may or
       * may not have reached the ERP), but retryability still follows the
       * step: for steps with downstream dedup, replaying the ambiguous case
       * is exactly what the dedup makes safe. */
      await recordPaymentIncident({
        client,
        paymentContext: {
          id: context.id,
          payer: context.payer,
          data,
          mode: context.mode,
        },
        failure: {
          status: SAGA_FAILURE_STATUS.reconcileRequired,
          step: step ?? 'unknown',
          reason: failureReason,
          detail: failureReason,
        },
      });

      console.warn(
        '[PAYMENT-SAGA][STARTUP] Flagged interrupted saga for reconciliation',
        {contextId: context.id, step},
      );
    } catch (err) {
      console.error('[PAYMENT-SAGA][STARTUP] Failed to flag stuck context', {
        contextId: context.id,
        error: (err as Error).message,
      });
    }
  }
}
