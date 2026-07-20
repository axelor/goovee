// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import {SAGA_OUTCOME_STATUS} from '@/lib/core/saga';
import type {SagaOutcome} from '@/lib/core/saga';
import type {ErrorResponse} from '@/types/action';

/**
 * Maps a non-successful saga outcome to a server-action error response.
 * Returns null when the saga completed. The money is already captured at this
 * point, so failures land in the ERP queues — never retried by the caller.
 *
 * Shared by every subapp's redirect-return actions (invoices today, shop and
 * events in later phases) so users get consistent wording across apps.
 */
export async function getSagaErrorResponse(
  outcome: SagaOutcome,
): Promise<ErrorResponse | null> {
  if (outcome.status === SAGA_OUTCOME_STATUS.completed) return null;

  if (outcome.status === SAGA_OUTCOME_STATUS.notClaimed) {
    return {
      error: true,
      message: await t('This payment is already being processed.'),
    };
  }

  return {
    error: true,
    message: await t(
      'Something went wrong while completing your request. Your payment was received — our team will review and finish the processing. You do not need to pay again.',
    ),
  };
}
