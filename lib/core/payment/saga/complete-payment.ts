// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {TenantConfig} from '@/tenant';
import {
  runSaga,
  SAGA_FAILURE_STATUS,
  SAGA_OUTCOME_STATUS,
} from '@/lib/core/saga';
import type {SagaDefinition, SagaOutcome} from '@/lib/core/saga';
import type {PaymentContext, PaymentSource} from '../common/type';
import {notifyPaymentUpdate, PAYMENT_UPDATE_STATUS} from '../sse';

// ---- LOCAL IMPORTS ---- //
import {recordPaymentIncident} from './incident';
import {paymentSagaPersistence} from './orm';
import {getPaymentSagaDefinition} from './registry';
import type {PaymentSagaContext} from './types';

/**
 * Fallback definition for contexts the registry cannot serve (corrupted data
 * or a source with no saga yet). Money was captured, so this is never a quiet
 * skip — the single failing step routes the context into the reconcile queue
 * with an explicit reason.
 */
function unresolvableSaga(reason: string): SagaDefinition<PaymentSagaContext> {
  return {
    steps: [
      {
        name: 'resolveSaga',
        onFailure: SAGA_FAILURE_STATUS.reconcileRequired,
        execute: async () => {
          throw new Error(reason);
        },
      },
    ],
  };
}

/**
 * Single entry point for the post-capture business tail — called by every
 * webhook, redirect-return action and poller once the gateway has confirmed
 * the money. Claims the context atomically (pending → processing), runs the
 * source's saga exactly once, and notifies SSE on every terminal outcome.
 *
 * Callers must treat any outcome other than `not_claimed` as final:
 * webhooks respond 200 (redelivery cannot help past the claim) and only
 * pre-claim errors may respond 500.
 */
export async function completePayment({
  tenantId,
  client,
  config,
  paymentContext,
  amount,
  providerTransactionRef,
}: {
  tenantId: string;
  client: Client;
  config: TenantConfig;
  paymentContext: PaymentContext;
  /** Gateway-reported paid amount; defaults to the amount stored in the context. */
  amount?: string | number;
  /**
   * Provider-side id of the captured payment (Stripe PaymentIntent, PayPal
   * capture...). Merged into the context data so a failure incident carries
   * the refund key.
   */
  providerTransactionRef?: string | null;
}): Promise<SagaOutcome> {
  const source = paymentContext.data?.source as PaymentSource | undefined;
  const entityId = paymentContext.data?.id;

  /* In-memory merge only — the first recordStep after the claim persists it.
   * Never overwritten once set (a redelivery cannot re-key the payment). */
  if (providerTransactionRef && !paymentContext.data?.providerTransactionRef) {
    paymentContext.data = {...paymentContext.data, providerTransactionRef};
  }

  const context: PaymentSagaContext = {
    tenantId,
    client,
    config,
    paymentContext,
    source,
    entityId,
    amount: amount ?? paymentContext.data?.amount,
    paymentModeId: paymentContext.data?.paymentModeId,
  };

  let definition: SagaDefinition<PaymentSagaContext> | undefined;
  /* Only `source` is required to route — `entityId` may legitimately be
   * absent when the saga creates the entity itself (shop orders, events
   * registrations). Each definition validates the payload it needs and
   * throws with its reason. */
  if (!source) {
    definition = unresolvableSaga('Missing payment source in context data');
  } else {
    definition =
      getPaymentSagaDefinition(source) ??
      unresolvableSaga(`No payment saga registered for source '${source}'`);
  }

  const outcome = await runSaga({
    definition,
    persistence: paymentSagaPersistence,
    context,
  });

  /* Saga-created entity ids (shop order, events registration) land on the
   * context data mid-run — re-read so the failure log carries them once the
   * creating step succeeded. SSE below keeps the claim-time id on purpose:
   * only pages that know the entity id before paying (invoices) can
   * subscribe; if shop/events ever get a webhook tail, key SSE by contextId. */
  const resolvedEntityId = paymentContext.data?.id ?? entityId;

  // TODO(saga): notify the admin when the outcome is a terminal failure
  // (refund_required / reconcile_required) — money is captured and a human
  // must act, but today the failure only lands in the DB queue + server logs.
  // Send an email via @/notification with contextId, source, entityId, amount,
  // payer and failureReason. Blocked on: an ops-admin recipient field in the
  // per-tenant/workspace payment config (does not exist yet).

  if (
    outcome.status !== SAGA_OUTCOME_STATUS.completed &&
    outcome.status !== SAGA_OUTCOME_STATUS.notClaimed
  ) {
    // Central failure log — callers map the outcome to user-facing responses
    // and must not need their own logging for the reason to be traceable.
    console.error('[SAGA] Payment saga failed', {
      contextId: paymentContext.id,
      source,
      entityId: resolvedEntityId,
      status: outcome.status,
      step: outcome.step,
      reason: outcome.reason,
    });

    // Surface the failure in the ERP queues (best-effort — the context status
    // is already persisted and stays the source of truth).
    await recordPaymentIncident({client, paymentContext, failure: outcome});
  }

  if (source && entityId && outcome.status !== SAGA_OUTCOME_STATUS.notClaimed) {
    notifyPaymentUpdate(
      source,
      entityId,
      paymentContext.id,
      outcome.status === SAGA_OUTCOME_STATUS.completed
        ? PAYMENT_UPDATE_STATUS.SUCCESS
        : PAYMENT_UPDATE_STATUS.FAILED,
    );
  }

  return outcome;
}
