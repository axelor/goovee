// ---- CORE IMPORTS ---- //
import type {SagaFailure, SagaPersistence} from '@/lib/core/saga';
import {CONTEXT_STATUS} from '../common/orm';

// ---- LOCAL IMPORTS ---- //
import type {PaymentSagaContext} from './types';

/**
 * Saga persistence backed by portal_payment_context. The saga state IS the
 * context status; step progress lives under data.saga.
 *
 * SagaFailureStatus values ('refund_required' | 'reconcile_required') are the
 * corresponding CONTEXT_STATUS values by design — no mapping needed.
 */
export const paymentSagaPersistence: SagaPersistence<PaymentSagaContext> = {
  /**
   * Atomic claim: pending → processing, guarded by both version and status in
   * a single conditional UPDATE. The ORM's optimistic update is check-then-save
   * (two statements), which would leave a small double-claim window — raw SQL
   * is used here, and only here, to close it.
   */
  async claim(ctx) {
    const {id, version, status} = ctx.paymentContext;

    if (status !== CONTEXT_STATUS.pending) return false;

    const result = (await ctx.client.$raw(
      `UPDATE portal_payment_context
          SET status = $1, version = version + 1, updated_on = $2
        WHERE id = $3 AND version = $4 AND status = $5
    RETURNING version`,
      CONTEXT_STATUS.processing,
      new Date(),
      id,
      version,
      CONTEXT_STATUS.pending,
    )) as [Array<{version: number}>, number];

    const [rows, affected] = result;
    if (!affected || !rows?.length) return false;

    ctx.paymentContext.version = Number(rows[0].version);
    ctx.paymentContext.status = CONTEXT_STATUS.processing;
    return true;
  },

  async recordStep(ctx, stepName) {
    const {paymentContext, client} = ctx;
    const data = {
      ...paymentContext.data,
      saga: {...paymentContext.data?.saga, step: stepName},
    };

    const updated = await client.paymentContext.update({
      data: {
        id: paymentContext.id,
        version: paymentContext.version,
        data: Promise.resolve(data),
        updatedOn: new Date(),
      },
      select: {id: true, version: true},
    });

    paymentContext.version = updated.version;
    paymentContext.data = data;
  },

  async recordCompleted(ctx) {
    const {paymentContext, client} = ctx;

    const updated = await client.paymentContext.update({
      data: {
        id: paymentContext.id,
        version: paymentContext.version,
        status: CONTEXT_STATUS.processed,
        updatedOn: new Date(),
      },
      select: {id: true, version: true},
    });

    paymentContext.version = updated.version;
    paymentContext.status = CONTEXT_STATUS.processed;
  },

  async recordFailed(ctx, failure: SagaFailure) {
    const {paymentContext, client} = ctx;
    const data = {
      ...paymentContext.data,
      saga: {
        ...paymentContext.data?.saga,
        step: failure.step,
        error: failure.detail,
      },
    };

    const updated = await client.paymentContext.update({
      data: {
        id: paymentContext.id,
        version: paymentContext.version,
        status: failure.status,
        failureReason: failure.reason,
        data: Promise.resolve(data),
        updatedOn: new Date(),
      },
      select: {id: true, version: true},
    });

    paymentContext.version = updated.version;
    paymentContext.status = failure.status;
    paymentContext.data = data;
  },
};
