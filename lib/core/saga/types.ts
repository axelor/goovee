/**
 * Generic saga engine types. The engine is domain-agnostic: it knows nothing
 * about payments — consumers provide a persistence implementation and a step
 * definition, and the engine guarantees each step runs exactly once.
 *
 * There are deliberately NO automatic retries: a step either succeeds or the
 * saga terminates in the step's declared failure status for a human to resolve.
 */

export const SAGA_FAILURE_STATUS = {
  refundRequired: 'refund_required',
  reconcileRequired: 'reconcile_required',
} as const;

export type SagaFailureStatus =
  (typeof SAGA_FAILURE_STATUS)[keyof typeof SAGA_FAILURE_STATUS];

export const SAGA_OUTCOME_STATUS = {
  completed: 'completed',
  notClaimed: 'not_claimed',
  ...SAGA_FAILURE_STATUS,
} as const;

/**
 * Error a step (or the service it drives) may throw when it knows more than
 * the step's static `onFailure` — e.g. the downstream call reported that part
 * of the work WAS committed, so the truthful queue is reconcile rather than
 * refund. `routeTo` overrides the failure status; `entityId` carries the
 * committed entity's id for the step to persist before rethrowing.
 */
export class SagaStepError extends Error {
  readonly routeTo?: SagaFailureStatus;
  readonly entityId?: string;
  readonly stage?: string;

  constructor(
    message: string,
    options: {
      routeTo?: SagaFailureStatus;
      entityId?: string;
      stage?: string;
    } = {},
  ) {
    super(message);
    this.name = 'SagaStepError';
    this.routeTo = options.routeTo;
    this.entityId = options.entityId;
    this.stage = options.stage;
  }
}

export type SagaStep<TContext> = {
  name: string;
  /** Terminal status this step's failure routes to. */
  onFailure: SagaFailureStatus;
  /** Runs exactly once. Throw to fail the saga — the error message becomes the failure reason. */
  execute: (context: TContext) => Promise<void>;
};

export type SagaDefinition<TContext> = {
  steps: SagaStep<TContext>[];
};

export type SagaFailure = {
  status: SagaFailureStatus;
  /** Name of the step that failed. */
  step: string;
  /**
   * How far inside the step the downstream side got before failing, for steps
   * that drive a multi-transaction chain (e.g. AOS reports 'invoicePayment'
   * for shop createOrder). Absent when the step is atomic.
   */
  stage?: string;
  /** Short human-readable reason (grid/column friendly). */
  reason: string;
  /** Larger diagnostic excerpt (stack / response body). */
  detail: string;
};

export type SagaOutcome =
  | {status: typeof SAGA_OUTCOME_STATUS.completed}
  | {status: typeof SAGA_OUTCOME_STATUS.notClaimed}
  | SagaFailure;

export interface SagaPersistence<TContext> {
  /**
   * Atomically take ownership of the saga. Must return false when another
   * runner already claimed it or it is no longer claimable — the engine then
   * exits without touching anything.
   */
  claim: (context: TContext) => Promise<boolean>;
  /** Record the step about to run, so an interrupted saga can be identified. */
  recordStep: (context: TContext, stepName: string) => Promise<void>;
  /** Record the terminal success state. */
  recordCompleted: (context: TContext) => Promise<void>;
  /** Record a terminal failure state with its reason. */
  recordFailed: (context: TContext, failure: SagaFailure) => Promise<void>;
}
