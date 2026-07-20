// ---- CORE IMPORTS ---- //
import {SAGA_OUTCOME_STATUS, SagaStepError} from './types';
import type {SagaDefinition, SagaOutcome, SagaPersistence} from './types';

const REASON_MAX_LENGTH = 255;
const DETAIL_MAX_LENGTH = 2000;

function normalizeError(
  stepName: string,
  error: unknown,
): {
  reason: string;
  detail: string;
} {
  const message =
    error instanceof Error ? error.message : String(error ?? 'Unknown error');

  /* detail is admin-facing (read from the persisted record, e.g. an ERP
   * grid): the full message covers long AOS response excerpts that overflow
   * the reason column. Stacks stay out of the DB — they are developer-facing
   * and are logged by the engine at failure time instead. */
  return {
    reason: `${stepName}: ${message}`.slice(0, REASON_MAX_LENGTH),
    detail: message.slice(0, DETAIL_MAX_LENGTH),
  };
}

/**
 * Runs a saga: claim ownership, then execute each step in order exactly once.
 * The first step that throws terminates the saga in that step's declared
 * failure status — there are no retries and no automatic compensation.
 */
export async function runSaga<TContext>({
  definition,
  persistence,
  context,
}: {
  definition: SagaDefinition<TContext>;
  persistence: SagaPersistence<TContext>;
  context: TContext;
}): Promise<SagaOutcome> {
  const steps = definition.steps;

  const claimed = await persistence.claim(context);
  if (!claimed) {
    return {status: SAGA_OUTCOME_STATUS.notClaimed};
  }

  for (const step of steps) {
    try {
      await persistence.recordStep(context, step.name);
      await step.execute(context);
    } catch (error) {
      // The only place the raw error (with stack) is guaranteed to be logged —
      // the persisted failure keeps the message only.
      console.error(`[SAGA] Step '${step.name}' failed`, error);

      const failure = {
        // A step that learned the true damage may re-route its failure
        // (e.g. "the order WAS committed" → reconcile instead of refund).
        status:
          error instanceof SagaStepError && error.routeTo
            ? error.routeTo
            : step.onFailure,
        step: step.name,
        stage: error instanceof SagaStepError ? error.stage : undefined,
        ...normalizeError(step.name, error),
      };

      try {
        await persistence.recordFailed(context, failure);
      } catch (persistError) {
        // The context stays in its claimed state and will be flagged by the
        // startup sweep — never leave the failure unlogged.
        console.error('[SAGA] Failed to record saga failure', {
          step: step.name,
          failure,
          error:
            persistError instanceof Error ? persistError.message : persistError,
        });
      }

      return failure;
    }
  }

  await persistence.recordCompleted(context);
  return {status: SAGA_OUTCOME_STATUS.completed};
}
